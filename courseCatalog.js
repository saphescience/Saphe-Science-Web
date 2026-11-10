(() => {
  const root = document.querySelector('[data-course-catalog]');
  if (!root) return;

  const i18n = window.SapheI18n;
  const data = window.SapheCourseCatalog;
  const pageKey = root.dataset.courseCatalog;
  const page = data.pages[pageKey];
  const selected = [];
  const intro = root.querySelector('.catalog-intro');
  const steps = root.querySelector('.catalog-steps');
  const result = root.querySelector('.catalog-result');
  const sources = root.querySelector('.catalog-sources');
  const status = root.querySelector('.catalog-status');
  const lang = () => i18n.getLanguage();
  const local = copy => copy[lang()];
  const label = key => data[lang()][key];
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };

  function reference(source) {
    const anchor = el('a', local(source.title));
    anchor.href = source.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }

  function accordion(title, text, key, expanded) {
    const details = el('details', '', 'catalog-block');
    details.dataset.block = key;
    details.open = expanded.has(key);
    details.append(el('summary', title), el('p', text));
    return details;
  }

  function render(keepExpanded = false) {
    const expanded = new Set(keepExpanded
      ? Array.from(result.querySelectorAll('details[open]'), node => node.dataset.block)
      : ['topic-0']);
    intro.textContent = local(page.intro);
    steps.replaceChildren();
    result.replaceChildren();
    sources.replaceChildren();
    let current = page;
    let scope = page;
    let depth = 0;
    const trail = [];

    while (current.children) {
      const section = el('section', '', 'catalog-step');
      const heading = el('h2', label(current.step));
      heading.id = `catalog-step-${depth}`;
      section.setAttribute('aria-labelledby', heading.id);
      const count = el('span', String(depth + 1).padStart(2, '0'), 'catalog-step__number');
      count.setAttribute('aria-hidden', 'true');
      heading.prepend(count);
      const options = el('div', '', 'catalog-options');
      current.children.forEach((choice, index) => {
        const button = el('button', local(choice.title), 'catalog-choice');
        button.type = 'button';
        button.dataset.depth = depth;
        button.dataset.index = index;
        button.setAttribute('aria-pressed', String(selected[depth] === index));
        options.append(button);
      });
      section.append(heading, options);
      steps.append(section);
      if (selected[depth] === undefined) break;
      current = current.children[selected[depth]];
      if (current.scope) scope = data.pages[current.scope];
      trail.push(local(current.title));
      depth++;
    }

    const links = current.source ? [current.source] : scope.sources || [];
    if (links.length) {
      sources.append(el('h2', label('sources')));
      const list = el('ul');
      links.forEach(source => {
        const item = el('li');
        item.append(reference(source));
        list.append(item);
      });
      sources.append(list);
    }

    if (!current.blocks) return;
    result.append(el('h2', label('syllabus')), el('p', trail.join(' / '), 'catalog-trail'));
    if (scope !== page) {
      result.append(el('p', local(scope.intro), 'catalog-note'));
    }
    if (current.note) result.append(el('p', local(current.note), 'catalog-note'));
    current.blocks.forEach((block, index) => {
      result.append(accordion(local(block.title), local(block.text), `topic-${index}`, expanded));
    });

    scope.resources?.forEach(resource => {
      const details = accordion(label(resource.key), resource.source ? '' : label('pending'), resource.key, expanded);
      if (resource.source) details.querySelector('p').append(reference(resource.source));
      result.append(details);
    });
  }

  steps.addEventListener('click', event => {
    const button = event.target.closest('.catalog-choice');
    if (!button) return;
    const depth = Number(button.dataset.depth);
    const index = Number(button.dataset.index);
    const wasSelected = selected[depth] === index;
    selected.splice(depth);
    if (!wasSelected) selected.push(index);
    render();
    const control = steps.querySelector(`[data-depth="${depth}"][data-index="${index}"]`);
    control.focus({ preventScroll: true });
    status.textContent = wasSelected ? '' : control.textContent;
  });

  i18n.onLanguageChange(() => render(true));
  render();
})();
