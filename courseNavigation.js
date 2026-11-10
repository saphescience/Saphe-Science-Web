(() => {
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.course-nav').forEach(control => {
    const toggle = control.querySelector('.course-nav__toggle');
    const menu = control.querySelector('.course-nav__menu');
    const links = [...menu.querySelectorAll('a')];
    let openedByHover = false;
    const setOpen = open => {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => {
      setOpen(menu.hidden || openedByHover);
      openedByHover = false;
    });
    control.addEventListener('pointerenter', event => {
      if (hover.matches && event.pointerType !== 'touch' && menu.hidden) {
        setOpen(true);
        openedByHover = true;
      }
    });
    control.addEventListener('pointerleave', event => {
      if (hover.matches && event.pointerType !== 'touch') {
        if (menu.contains(document.activeElement)) toggle.focus();
        setOpen(false);
        openedByHover = false;
      }
    });
    control.addEventListener('focusout', event => {
      if (!control.contains(event.relatedTarget)) setOpen(false);
    });
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
        event.stopPropagation();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setOpen(true);
        const index = links.indexOf(document.activeElement);
        const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1)
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links[next].focus();
      }
    });
    links.forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', event => {
      if (!control.contains(event.target)) setOpen(false);
    });
    hover.addEventListener('change', () => setOpen(false));
  });
})();
