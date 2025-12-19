const { strict: assert } = require('assert');
require('dotenv').config();

const BASE_URL = 'http://localhost:4000/api';
// Assuming these are in .env, otherwise we might need to fallback or ask
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function request(path, method = 'GET', token, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const text = await res.text();
        let data = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            // console.log('Response not JSON:', text);
        }
        return { status: res.status, data };
    } catch (e) {
        console.error(`Request failed: ${method} ${path}`, e.message);
        return { status: 0, data: {} };
    }
}

async function run() {
    console.log('Starting verification...');

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error('ADMIN_EMAIL/PASSWORD not in .env');
    }

    // 1. Login Admin
    console.log('Logging in Admin...');
    const { status: lStatus, data: lData } = await request('/auth/login', 'POST', null, {
        email: ADMIN_EMAIL, password: ADMIN_PASSWORD
    });

    if (lStatus !== 200) {
        console.error('Admin login failed:', lData);
        throw new Error('Admin login failed');
    }
    const adminToken = lData.token;
    console.log('Admin logged in.');

    // 2. Create Manager
    const managerEmail = `man_${Date.now()}@test.com`;
    const managerPass = 'password123';
    console.log(`Creating Manager: ${managerEmail}`);
    const { status: mStatus, data: mData } = await request('/managers', 'POST', adminToken, {
        email: managerEmail, password: managerPass
    });

    // We assume 200 or 201
    assert.ok(mStatus === 201 || mStatus === 200, `Create manager failed: ${mStatus}`);
    console.log('Manager created.');

    // Login Manager
    const { data: manLogin, status: mlStatus } = await request('/auth/login', 'POST', null, {
        email: managerEmail, password: managerPass
    });
    if (mlStatus !== 200) throw new Error('Manager login failed');
    const managerToken = manLogin.token;

    // 3. Create Seller
    const sellerEmail = `sel_${Date.now()}@test.com`;
    const sellerPass = 'password123';
    console.log(`Creating Seller: ${sellerEmail}`);
    const { status: sStatus, data: sData } = await request('/sellers', 'POST', managerToken, {
        email: sellerEmail, password: sellerPass
    });

    assert.ok(sStatus === 201 || sStatus === 200, `Create seller failed: ${sStatus}`);
    const sellerId = sData.id;
    console.log('Seller created.');

    // Login Seller
    const { data: selLogin, status: slStatus } = await request('/auth/login', 'POST', null, {
        email: sellerEmail, password: sellerPass
    });
    if (slStatus !== 200) throw new Error('Seller login failed');
    const sellerToken = selLogin.token;

    // 4. Create Product (Manager)
    console.log('Creating Product...');
    const { status: pStatus, data: pData } = await request('/products', 'POST', managerToken, {
        title: 'Test Product ' + Date.now(), base_price: 100, stock_quantity: 5
    });
    assert.equal(pStatus, 201, `Create product failed: ${JSON.stringify(pData)}`);
    const productId = pData.id;
    console.log('Product created.');

    // 5. Assign Product (Manager)
    console.log('Assigning Product...');
    const { status: aStatus, data: aData } = await request(`/products/${productId}/assign`, 'POST', managerToken, {
        seller_id: sellerId
    });
    assert.equal(aStatus, 201, `Assignment failed: ${JSON.stringify(aData)}`);
    const assignmentId = aData.id;
    console.log('Product assigned.');

    // 6. Try Assign Again (Manager) -> Expect Fail
    console.log('Attempting duplicate assignment...');
    const { status: a2Status, data: a2Data } = await request(`/products/${productId}/assign`, 'POST', managerToken, {
        seller_id: sellerId
    });
    assert.equal(a2Status, 400, 'Duplicate assignment should fail'); // Should be 400 Bad Request
    console.log('Duplicate assignment blocked (Expected).');

    // 7. Sell 1 unit (Seller)
    console.log('Selling unit 1...');
    const { status: sale1Status, data: sale1Data } = await request('/sales', 'POST', sellerToken, {
        assignment_id: assignmentId
    });
    assert.equal(sale1Status, 201, `Sale 1 failed: ${JSON.stringify(sale1Data)}`);
    console.log('Sale 1 recorded.');

    // 8. Sell 2nd unit (Seller)
    console.log('Selling unit 2...');
    const { status: sale2Status, data: sale2Data } = await request('/sales', 'POST', sellerToken, {
        assignment_id: assignmentId
    });
    assert.equal(sale2Status, 201, `Sale 2 failed: ${JSON.stringify(sale2Data)}`);
    console.log('Sale 2 recorded.');

    // 9. Check Stock (Manager)
    console.log('Checking Stock...');
    const { data: stockData } = await request(`/products/${productId}/stock`, 'GET', managerToken);
    console.log('Stock Data:', stockData);
    assert.equal(stockData.sold, 2, 'Sold count mismatch');
    assert.equal(stockData.available, 3, 'Available count mismatch');
    console.log('Stock counts verified.');

    // 10. Unassign (Manager)
    console.log('Unassigning...');
    const { status: uStatus } = await request(`/products/assignments/${assignmentId}`, 'DELETE', managerToken);
    assert.equal(uStatus, 200, 'Unassign failed');
    console.log('Assignment removed.');

    // 11. Verify Seller cannot see it anymore (or status is probleme)
    console.log('Verifying removal...');
    const { data: sAssignments } = await request('/products/assignments/list', 'GET', sellerToken);

    // If it was marked as probleme, it might still show up depending on filters?
    const assignment = sAssignments.find(a => a.id === assignmentId);

    if (assignment) {
        // If it exists, it MUST have status 'probleme'
        assert.equal(assignment.status, 'probleme', 'Assignment status should be probleme if not deleted');
        console.log('Assignment marked as probleme/retired (Expected).');
    } else {
        console.log('Assignment deleted (Expected).');
    }

    // Try to sell again (using the old ID, should fail)
    const { status: sale3Status, data: sale3Data } = await request('/sales', 'POST', sellerToken, {
        assignment_id: assignmentId
    });

    if (sale3Status === 404) {
        console.log('Seller cannot sell removed assignment (404).');
    } else if (sale3Status === 400) {
        console.log('Seller cannot sell removed assignment (400 - ' + sale3Data.error + ').');
    } else {
        throw new Error(`Unexpected status for sale of unassigned product: ${sale3Status}`);
    }

    console.log('\n✅ VERIFICATION SUCCESSFUL');
}

run().catch(e => {
    console.error('\n❌ VERIFICATION FAILED:', e.message);
    process.exit(1);
});
