// Composants UI réutilisables

export function createButton(
  text: string,
  options: {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit';
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
  } = {}
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = options.type || 'button';
  btn.textContent = text;
  btn.disabled = options.disabled || false;
  
  const classes = ['btn', `btn-${options.variant || 'primary'}`, `btn-${options.size || 'md'}`];
  if (options.className) classes.push(options.className);
  btn.className = classes.join(' ');
  
  if (options.onClick) {
    btn.addEventListener('click', options.onClick);
  }
  
  return btn;
}

export function createInput(
  options: {
    type?: string;
    name: string;
    placeholder?: string;
    value?: string;
    required?: boolean;
    label?: string;
  }
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';
  
  if (options.label) {
    const label = document.createElement('label');
    label.htmlFor = options.name;
    label.textContent = options.label;
    wrapper.appendChild(label);
  }
  
  const input = document.createElement('input');
  input.type = options.type || 'text';
  input.name = options.name;
  input.id = options.name;
  input.placeholder = options.placeholder || '';
  input.value = options.value || '';
  input.required = options.required || false;
  input.className = 'form-input';
  
  wrapper.appendChild(input);
  return wrapper;
}

export function createSelect(
  options: {
    name: string;
    label?: string;
    options: { value: string; label: string }[];
    value?: string;
  }
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';
  
  if (options.label) {
    const label = document.createElement('label');
    label.htmlFor = options.name;
    label.textContent = options.label;
    wrapper.appendChild(label);
  }
  
  const select = document.createElement('select');
  select.name = options.name;
  select.id = options.name;
  select.className = 'form-select';
  
  options.options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === options.value) option.selected = true;
    select.appendChild(option);
  });
  
  wrapper.appendChild(select);
  return wrapper;
}

export function createCard(content: HTMLElement | string, className?: string): HTMLDivElement {
  const card = document.createElement('div');
  card.className = `card ${className || ''}`;
  
  if (typeof content === 'string') {
    card.innerHTML = content;
  } else {
    card.appendChild(content);
  }
  
  return card;
}

export function createModal(
  title: string,
  content: HTMLElement,
  options: {
    onClose?: () => void;
    showClose?: boolean;
  } = {}
): HTMLDivElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const header = document.createElement('div');
  header.className = 'modal-header';
  
  const titleEl = document.createElement('h2');
  titleEl.textContent = title;
  header.appendChild(titleEl);
  
  if (options.showClose !== false) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
      overlay.remove();
      options.onClose?.();
    };
    header.appendChild(closeBtn);
  }
  
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.appendChild(content);
  
  modal.appendChild(header);
  modal.appendChild(body);
  overlay.appendChild(modal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      options.onClose?.();
    }
  });
  
  return overlay;
}

export function createTable<T>(
  data: T[],
  columns: { key: keyof T | string; label: string; render?: (item: T) => string | HTMLElement }[],
  options: {
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
  } = {}
): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'data-table';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  
  if (data.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = columns.length;
    emptyCell.className = 'empty-message';
    emptyCell.textContent = options.emptyMessage || 'Aucune donnée';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    data.forEach(item => {
      const row = document.createElement('tr');
      if (options.onRowClick) {
        row.className = 'clickable';
        row.onclick = () => options.onRowClick!(item);
      }
      
      columns.forEach(col => {
        const td = document.createElement('td');
        if (col.render) {
          const rendered = col.render(item);
          if (typeof rendered === 'string') {
            td.innerHTML = rendered;
          } else {
            td.appendChild(rendered);
          }
        } else {
          td.textContent = String((item as any)[col.key] ?? '');
        }
        row.appendChild(td);
      });
      
      tbody.appendChild(row);
    });
  }
  
  table.appendChild(tbody);
  return table;
}

export function createBadge(text: string, variant: 'success' | 'warning' | 'danger' | 'info' = 'info'): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = `badge badge-${variant}`;
  badge.textContent = text;
  return badge;
}

export function createLoader(): HTMLDivElement {
  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.innerHTML = '<div class="spinner"></div>';
  return loader;
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function createStatsCard(
  title: string,
  value: string | number,
  icon: string,
  trend?: { value: number; label: string }
): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'stats-card';
  
  card.innerHTML = `
    <div class="stats-icon">${icon}</div>
    <div class="stats-content">
      <h3 class="stats-title">${title}</h3>
      <p class="stats-value">${value}</p>
      ${trend ? `<span class="stats-trend ${trend.value >= 0 ? 'positive' : 'negative'}">
        ${trend.value >= 0 ? '↑' : '↓'} ${Math.abs(trend.value)}% ${trend.label}
      </span>` : ''}
    </div>
  `;
  
  return card;
}

