// options for all examples
const options = ['Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cantaloupe', 'Cherry', 'Date', 'Durian', 'Eggplant', 'Fig', 'Grape', 'Guava', 'Huckleberry'];

/*
 * Helper constants and functions
 */

// make it easier for ourselves by putting some values in objects
// in TypeScript, these would be enums
const Keys = {
  Backspace: 'Backspace',
  Clear: 'Clear',
  Down: 'ArrowDown',
  End: 'End',
  Enter: 'Enter',
  Escape: 'Escape',
  Home: 'Home',
  Left: 'ArrowLeft',
  PageDown: 'PageDown',
  PageUp: 'PageUp',
  Right: 'ArrowRight',
  Space: ' ',
  Tab: 'Tab',
  Up: 'ArrowUp'
}

const MenuActions = {
  Close: 0,
  CloseSelect: 1,
  First: 2,
  Last: 3,
  Next: 4,
  Open: 5,
  Previous: 6,
  Select: 7,
  Space: 8,
  Type: 9
}

// filter an array of options against an input string
// returns an array of options that begin with the filter string, case-independent
function filterOptions(options = [], filter, exclude = []) {
  return options.filter((option) => {
    const matches = option.toLowerCase().indexOf(filter.toLowerCase()) === 0;
    return matches && exclude.indexOf(option) < 0;
  });
}

// return an array of exact option name matches from a comma-separated string
function findMatches(options, search) {
  const names = search.split(',');
  return names.map((name) => {
    const match = options.filter((option) => name.trim().toLowerCase() === option.toLowerCase());
    return match.length > 0 ? match[0] : null;
  })
  .filter((option) => option !== null);
}

// return combobox action from key press
function getActionFromKey(key, menuOpen) {
  // handle opening when closed
  if (!menuOpen && key === Keys.Down) {
    return MenuActions.Open;
  }

  // handle keys when open
  if (key === Keys.Down) {
    return MenuActions.Next;
  }
  else if (key === Keys.Up) {
    return MenuActions.Previous;
  }
  else if (key === Keys.Home) {
    return MenuActions.First;
  }
  else if (key === Keys.End) {
    return MenuActions.Last;
  }
  else if (key === Keys.Escape) {
    return MenuActions.Close;
  }
  else if (key === Keys.Enter) {
    return MenuActions.CloseSelect;
  }
  else if (key === Keys.Backspace || key === Keys.Clear || key.length === 1) {
    return MenuActions.Type;
  }
}

// get index of option that matches a string
function getIndexByLetter(options, filter) {
  const firstMatch = filterOptions(options, filter)[0];
  return firstMatch ? options.indexOf(firstMatch) : -1;
}

// get updated option index
function getUpdatedIndex(current, max, action) {
  switch(action) {
    case MenuActions.First:
      return 0;
    case MenuActions.Last:
      return max;
    case MenuActions.Previous:
      return Math.max(0, current - 1);
    case MenuActions.Next:
      return Math.min(max, current + 1);
    default:
      return current;
  }
}

// check if an element is currently scrollable
function isScrollable(element) {
  return element && element.clientHeight < element.scrollHeight;
}

// ensure given child element is within the parent's visible scroll area
function maintainScrollVisibility(activeElement, scrollParent) {
  const { offsetHeight, offsetTop } = activeElement;
  const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent;

  const isAbove = offsetTop < scrollTop;
  const isBelow = (offsetTop + offsetHeight) > (scrollTop + parentOffsetHeight);

  if (isAbove) {
    scrollParent.scrollTo(0, offsetTop);
  }
  else if (isBelow) {
    scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
  }
}

/*
 * Combobox w/o filtering or autoselect code
 */
 const ComboNoFilter = function(el, options) {
  // element refs
  this.el = el;
  this.comboEl = el.querySelector('[role=combobox]');
  this.inputEl = el.querySelector('input');
  this.listboxEl = el.querySelector('[role=listbox]');

  // data
  this.idBase = this.inputEl.id;
  this.options = options;

  // state
  this.activeIndex = 0;
  this.open = false;
}

ComboNoFilter.prototype.init = function() {

  this.inputEl.addEventListener('input', this.onInput.bind(this));
  this.inputEl.addEventListener('blur', this.onInputBlur.bind(this));
  this.inputEl.addEventListener('click', () => this.updateMenuState(true));
  this.inputEl.addEventListener('keydown', this.onInputKeyDown.bind(this));

  this.options.map((option, index) => {
    const optionEl = document.createElement('div');
    optionEl.setAttribute('role', 'option');
    optionEl.id = `${this.idBase}-${index}`;
    optionEl.className = index === 0 ? 'combo-option option-current' : 'combo-option';
    optionEl.setAttribute('aria-selected', 'false');
    optionEl.innerText = option;

    optionEl.addEventListener('click', () => { this.onOptionClick(index); });
    optionEl.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

    this.listboxEl.appendChild(optionEl);
  });
}

ComboNoFilter.prototype.onInput = function() {
  const curValue = this.inputEl.value;
  const matches = filterOptions(this.options, curValue);

  // set activeIndex to first matching option
  // (or leave it alone, if the active option is already in the matching set)
  const filterCurrentOption = matches.filter((option) => option === this.options[this.activeIndex]);
  if (matches.length > 0 && !filterCurrentOption.length) {
    this.onOptionChange(this.options.indexOf(matches[0]));
  }

  const menuState = this.options.length > 0;
  if (this.open !== menuState) {
    this.updateMenuState(menuState, false);
  }
}

ComboNoFilter.prototype.onInputKeyDown = function(event) {
  const { key } = event;
  const max = this.options.length - 1;

  const action = getActionFromKey(key, this.open);

  switch(action) {
    case MenuActions.Next:
    case MenuActions.Last:
    case MenuActions.First:
    case MenuActions.Previous:
      event.preventDefault();
      return this.onOptionChange(getUpdatedIndex(this.activeIndex, max, action));
    case MenuActions.CloseSelect:
      event.preventDefault();
      this.selectOption(this.activeIndex);
      return this.updateMenuState(false);
    case MenuActions.Close:
      event.preventDefault();
      return this.updateMenuState(false);
    case MenuActions.Open:
      return this.updateMenuState(true);
  }
}

ComboNoFilter.prototype.onInputBlur = function() {
  if (this.ignoreBlur) {
    this.ignoreBlur = false;
    return;
  }

  if (this.open) {
    this.updateMenuState(false, false);
  }
}

ComboNoFilter.prototype.onOptionChange = function(index) {
  this.activeIndex = index;
  this.inputEl.setAttribute('aria-activedescendant', `${this.idBase}-${index}`);

  // update active style
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.classList.remove('option-current');
  });
  options[index].classList.add('option-current');

  if (this.open && isScrollable(this.listboxEl)) {
    maintainScrollVisibility(options[index], this.listboxEl);
  }
}

ComboNoFilter.prototype.onOptionClick = function(index) {
  this.onOptionChange(index);
  this.selectOption(index);
  this.updateMenuState(false);
}

ComboNoFilter.prototype.onOptionMouseDown = function() {
  this.ignoreBlur = true;
}

ComboNoFilter.prototype.selectOption = function(index) {
  const selected = this.options[index];
  this.inputEl.value = selected;
  this.activeIndex = index;

  // update aria-selected
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.setAttribute('aria-selected', 'false');
  });
  options[index].setAttribute('aria-selected', 'true');
}

ComboNoFilter.prototype.updateMenuState = function(open, callFocus = true) {
  this.open = open;

  this.comboEl.setAttribute('aria-expanded', `${open}`);
  open ? this.el.classList.add('open') : this.el.classList.remove('open');
  callFocus && this.inputEl.focus();
}

// init combo
const noFilterEl = document.querySelector('.js-nofilter');
const noFilterComponent = new ComboNoFilter(noFilterEl, options);
noFilterComponent.init();

/*
 * Filtered Combobox code
 */
 const ComboFilter = function(el, options) {
  // element refs
  this.el = el;
  this.comboEl = el.querySelector('[role=combobox]');
  this.inputEl = el.querySelector('input');
  this.listboxEl = el.querySelector('[role=listbox]');

  // data
  this.idBase = this.inputEl.id;
  this.options = options;
  this.filteredOptions = options;

  // state
  this.activeIndex = 0;
  this.open = false;
}

ComboFilter.prototype.init = function() {

  this.inputEl.addEventListener('input', this.onInput.bind(this));
  this.inputEl.addEventListener('blur', this.onInputBlur.bind(this));
  this.inputEl.addEventListener('click', () => this.updateMenuState(true));
  this.inputEl.addEventListener('keydown', this.onInputKeyDown.bind(this));

  this.options.map((option, index) => {
    const optionEl = document.createElement('div');
    optionEl.setAttribute('role', 'option');
    optionEl.id = `${this.idBase}-${index}`;
    optionEl.className = index === 0 ? 'combo-option option-current' : 'combo-option';
    optionEl.setAttribute('aria-selected', 'false');
    optionEl.innerText = option;

    optionEl.addEventListener('click', () => { this.onOptionClick(index); });
    optionEl.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

    this.listboxEl.appendChild(optionEl);
  });
}

ComboFilter.prototype.filterOptions = function(value) {
  this.filteredOptions = filterOptions(this.options, value);

  // hide/show options based on filtering
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    const value = optionEl.innerText;
    if (this.filteredOptions.indexOf(value) > -1) {
      optionEl.style.display = 'block';
    }
    else {
      optionEl.style.display = 'none';
    }
  });
}

ComboFilter.prototype.onInput = function() {
  const curValue = this.inputEl.value;
  this.filterOptions(curValue);

  // if active option is not in filtered options, set it to first filtered option
  if (this.filteredOptions.indexOf(this.options[this.activeIndex]) < 0) {
    const firstFilteredIndex = this.options.indexOf(this.filteredOptions[0]);
    this.onOptionChange(firstFilteredIndex);
  }

  const menuState = this.filteredOptions.length > 0;
  if (this.open !== menuState) {
    this.updateMenuState(menuState, false);
  }
}

ComboFilter.prototype.onInputKeyDown = function(event) {
  const { key } = event;

  const max = this.filteredOptions.length - 1;
  const activeFilteredIndex = this.filteredOptions.indexOf(this.options[this.activeIndex]);

  const action = getActionFromKey(key, this.open);

  switch(action) {
    case MenuActions.Next:
    case MenuActions.Last:
    case MenuActions.First:
    case MenuActions.Previous:
      event.preventDefault();
      const nextFilteredIndex = getUpdatedIndex(activeFilteredIndex, max, action);
      const nextRealIndex = this.options.indexOf(this.filteredOptions[nextFilteredIndex]);
      return this.onOptionChange(nextRealIndex);
    case MenuActions.CloseSelect:
      event.preventDefault();
      this.selectOption(this.activeIndex);
      return this.updateMenuState(false);
    case MenuActions.Close:
      event.preventDefault();
      return this.updateMenuState(false);
    case MenuActions.Open:
      return this.updateMenuState(true);
  }
}

ComboFilter.prototype.onInputBlur = function() {
  if (this.ignoreBlur) {
    this.ignoreBlur = false;
    return;
  }

  if (this.open) {
    this.updateMenuState(false, false);
  }
}

ComboFilter.prototype.onOptionChange = function(index) {
  this.activeIndex = index;
  this.inputEl.setAttribute('aria-activedescendant', `${this.idBase}-${index}`);

  // update active style
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.classList.remove('option-current');
  });
  options[index].classList.add('option-current');

  if (this.open && isScrollable(this.listboxEl)) {
    maintainScrollVisibility(options[index], this.listboxEl);
  }
}

ComboFilter.prototype.onOptionClick = function(index) {
  this.onOptionChange(index);
  this.selectOption(index);
  this.updateMenuState(false);
}

ComboFilter.prototype.onOptionMouseDown = function() {
  this.ignoreBlur = true;
}

ComboFilter.prototype.selectOption = function(index) {
  const selected = this.options[index];
  this.inputEl.value = selected;
  this.activeIndex = index;
  this.filterOptions(selected);

  // update aria-selected
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.setAttribute('aria-selected', 'false');
  });
  options[index].setAttribute('aria-selected', 'true');
}

ComboFilter.prototype.updateMenuState = function(open, callFocus = true) {
  this.open = open;

  this.comboEl.setAttribute('aria-expanded', `${open}`);
  open ? this.el.classList.add('open') : this.el.classList.remove('open');
  callFocus && this.inputEl.focus();
}

// // init combo
// const filterEl = document.querySelector('.js-filter');
// const filterComponent = new ComboFilter(filterEl, options);
// filterComponent.init();

/*
 * ARIA 1.2 Filtered Combobox code
 */
 const ComboAria12 = function(el, options) {
  // element refs
  this.el = el;
  this.inputEl = el.querySelector('input');
  this.listboxEl = el.querySelector('[role=listbox]');

  // data
  this.idBase = this.inputEl.id;
  this.options = options;
  this.filteredOptions = options;

  // state
  this.activeIndex = 0;
  this.open = false;
}

ComboAria12.prototype.init = function() {
  this.inputEl.addEventListener('input', this.onInput.bind(this));
  this.inputEl.addEventListener('blur', this.onInputBlur.bind(this));
  this.inputEl.addEventListener('click', () => this.updateMenuState(true));
  this.inputEl.addEventListener('keydown', this.onInputKeyDown.bind(this));

  this.options.map((option, index) => {
    const optionEl = document.createElement('div');
    optionEl.setAttribute('role', 'option');
    optionEl.id = `${this.idBase}-${index}`;
    optionEl.className = index === 0 ? 'combo-option option-current' : 'combo-option';
    optionEl.setAttribute('aria-selected', 'false');
    optionEl.innerText = option;

    optionEl.addEventListener('click', () => { this.onOptionClick(index); });
    optionEl.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

    this.listboxEl.appendChild(optionEl);
  });
}

ComboAria12.prototype.filterOptions = function(value) {
  this.filteredOptions = filterOptions(this.options, value);

  // hide/show options based on filtering
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    const value = optionEl.innerText;
    if (this.filteredOptions.indexOf(value) > -1) {
      optionEl.style.display = 'block';
    }
    else {
      optionEl.style.display = 'none';
    }
  });
}

ComboAria12.prototype.onInput = function() {
  const curValue = this.inputEl.value;
  this.filterOptions(curValue);

  // if active option is not in filtered options, set it to first filtered option
  if (this.filteredOptions.indexOf(this.options[this.activeIndex]) < 0) {
    const firstFilteredIndex = this.options.indexOf(this.filteredOptions[0]);
    this.onOptionChange(firstFilteredIndex);
  }

  const menuState = this.filteredOptions.length > 0;
  if (this.open !== menuState) {
    this.updateMenuState(menuState, false);
  }
}

ComboAria12.prototype.onInputKeyDown = function(event) {
  const { key } = event;

  const max = this.filteredOptions.length - 1;
  const activeFilteredIndex = this.filteredOptions.indexOf(this.options[this.activeIndex]);

  const action = getActionFromKey(key, this.open);

  switch(action) {
    case MenuActions.Next:
    case MenuActions.Last:
    case MenuActions.First:
    case MenuActions.Previous:
      event.preventDefault();
      const nextFilteredIndex = getUpdatedIndex(activeFilteredIndex, max, action);
      const nextRealIndex = this.options.indexOf(this.filteredOptions[nextFilteredIndex]);
      return this.onOptionChange(nextRealIndex);
    case MenuActions.CloseSelect:
      event.preventDefault();
      this.selectOption(this.activeIndex);
      return this.updateMenuState(false);
    case MenuActions.Close:
      event.preventDefault();
      return this.updateMenuState(false);
    case MenuActions.Open:
      return this.updateMenuState(true);
  }
}

ComboAria12.prototype.onInputBlur = function() {
  if (this.ignoreBlur) {
    this.ignoreBlur = false;
    return;
  }

  if (this.open) {
    this.updateMenuState(false, false);
  }
}

ComboAria12.prototype.onOptionChange = function(index) {
  this.activeIndex = index;
  this.inputEl.setAttribute('aria-activedescendant', `${this.idBase}-${index}`);

  // update active style
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.classList.remove('option-current');
  });
  options[index].classList.add('option-current');

  if (this.open && isScrollable(this.listboxEl)) {
    maintainScrollVisibility(options[index], this.listboxEl);
  }
}

ComboAria12.prototype.onOptionClick = function(index) {
  this.onOptionChange(index);
  this.selectOption(index);
  this.updateMenuState(false);
}

ComboAria12.prototype.onOptionMouseDown = function() {
  this.ignoreBlur = true;
}

ComboAria12.prototype.selectOption = function(index) {
  const selected = this.options[index];
  this.inputEl.value = selected;
  this.activeIndex = index;
  this.filterOptions(selected);

  // update aria-selected
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.setAttribute('aria-selected', 'false');
  });
  options[index].setAttribute('aria-selected', 'true');
}

ComboAria12.prototype.updateMenuState = function(open, callFocus = true) {
  this.open = open;

  this.inputEl.setAttribute('aria-expanded', `${open}`);
  open ? this.el.classList.add('open') : this.el.classList.remove('open');
  callFocus && this.inputEl.focus();
}

// init combo
// const aria12El = document.querySelector('.js-aria12');
// const aria12Component = new ComboAria12(aria12El, options);
// aria12Component.init();

/*
 * Autoselect Combobox code
 */
 const ComboAutoselect = function(el, options) {
  // element refs
  this.el = el;
  this.comboEl = el.querySelector('[role=combobox]');
  this.inputEl = el.querySelector('input');
  this.listboxEl = el.querySelector('[role=listbox]');

  // data
  this.idBase = this.inputEl.id;
  this.options = options;
  this.filteredOptions = options;

  // state
  this.activeIndex = 0;
  this.selectedValue = options[0];
  this.open = false;
}

ComboAutoselect.prototype.init = function() {
  this.inputEl.value = this.options[0];

  this.inputEl.addEventListener('input', this.onInput.bind(this));
  this.inputEl.addEventListener('blur', this.onInputBlur.bind(this));
  this.inputEl.addEventListener('click', () => this.updateMenuState(true));
  this.inputEl.addEventListener('keydown', this.onInputKeyDown.bind(this));

  this.options.map((option, index) => {
    const optionEl = document.createElement('div');
    optionEl.setAttribute('role', 'option');
    optionEl.id = `${this.idBase}-${index}`;
    optionEl.className = index === 0 ? 'combo-option option-current' : 'combo-option';
    optionEl.setAttribute('aria-selected', `${index === 0}`);
    optionEl.innerText = option;

    optionEl.addEventListener('click', () => { this.onOptionClick(index); });
    optionEl.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

    this.listboxEl.appendChild(optionEl);
  });
}

ComboAutoselect.prototype.filterOptions = function(value) {
  this.filteredOptions = filterOptions(this.options, value);

  // hide/show options based on filtering
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    const value = optionEl.innerText;
    if (this.filteredOptions.indexOf(value) > -1) {
      optionEl.style.display = 'block';
    }
    else {
      optionEl.style.display = 'none';
    }
  });
}

ComboAutoselect.prototype.onInput = function() {
  const curValue = this.inputEl.value;
  this.filterOptions(curValue);

  // if active option is not in filtered options, set it to first filtered option
  if (this.filteredOptions.indexOf(this.options[this.activeIndex]) < 0) {
    const firstFilteredIndex = this.options.indexOf(this.filteredOptions[0]);
    this.onOptionChange(firstFilteredIndex);
  }

  const menuState = this.filteredOptions.length > 0;
  if (this.open !== menuState) {
    this.updateMenuState(menuState, false);
  }
}

ComboAutoselect.prototype.onInputKeyDown = function(event) {
  const { key } = event;

  const max = this.filteredOptions.length - 1;
  const activeFilteredIndex = this.filteredOptions.indexOf(this.options[this.activeIndex]);

  const action = getActionFromKey(key, this.open);

  switch(action) {
    case MenuActions.Next:
    case MenuActions.Last:
    case MenuActions.First:
    case MenuActions.Previous:
      event.preventDefault();
      const nextFilteredIndex = getUpdatedIndex(activeFilteredIndex, max, action);
      const nextRealIndex = this.options.indexOf(this.filteredOptions[nextFilteredIndex]);
      return this.onOptionChange(nextRealIndex);
    case MenuActions.CloseSelect:
      event.preventDefault();
      this.selectOption(this.activeIndex);
      return this.updateMenuState(false);
    case MenuActions.Close:
      event.preventDefault();
      const lastSelected = this.options.indexOf(this.selectedValue);
      this.onOptionChange(lastSelected);
      this.selectOption(lastSelected);
      this.filterOptions('');
      return this.updateMenuState(false);
    case MenuActions.Open:
      return this.updateMenuState(true);
  }
}

ComboAutoselect.prototype.onInputBlur = function() {
  if (this.ignoreBlur) {
    this.ignoreBlur = false;
    return;
  }

  if (this.open) {
    this.selectOption(this.activeIndex);
    this.updateMenuState(false, false);
  }
}

ComboAutoselect.prototype.onOptionChange = function(index) {
  this.activeIndex = index;
  this.inputEl.setAttribute('aria-activedescendant', `${this.idBase}-${index}`);

  // update active style
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.classList.remove('option-current');
  });
  options[index].classList.add('option-current');

  if (this.open && isScrollable(this.listboxEl)) {
    maintainScrollVisibility(options[index], this.listboxEl);
  }
}

ComboAutoselect.prototype.onOptionClick = function(index) {
  this.onOptionChange(index);
  this.selectOption(index);
  this.updateMenuState(false);
}

ComboAutoselect.prototype.onOptionMouseDown = function() {
  this.ignoreBlur = true;
}

ComboAutoselect.prototype.selectOption = function(index) {
  const selected = this.options[index];
  this.inputEl.value = selected;
  this.activeIndex = index;
  this.selectedValue = selected;
  this.filterOptions(selected);

  // update aria-selected
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.setAttribute('aria-selected', 'false');
  });
  options[index].setAttribute('aria-selected', 'true');
}

ComboAutoselect.prototype.updateMenuState = function(open, callFocus = true) {
  this.open = open;

  this.comboEl.setAttribute('aria-expanded', `${open}`);
  open ? this.el.classList.add('open') : this.el.classList.remove('open');
  callFocus && this.inputEl.focus();
}

// init combo
// const autoselectEl = document.querySelector('.js-autoselect');
// const autoselectComponent = new ComboAutoselect(autoselectEl, options);
// autoselectComponent.init();

/*
 * Autocomplete Combobox code
 */
 const ComboAutocomplete = function(el, options) {
  // element refs
  this.el = el;
  this.comboEl = el.querySelector('[role=combobox]');
  this.inputEl = el.querySelector('input');
  this.listboxEl = el.querySelector('[role=listbox]');

  // data
  this.idBase = this.inputEl.id;
  this.options = options;
  this.filteredOptions = options;

  // state
  this.activeIndex = 0;
  this.open = false;
  this.typedValue = ''; // keep track of typed vs. autocomplete value
}

ComboAutocomplete.prototype.init = function() {

  this.inputEl.addEventListener('input', this.onInput.bind(this));
  this.inputEl.addEventListener('blur', this.onInputBlur.bind(this));
  this.inputEl.addEventListener('click', () => this.updateMenuState(true));
  this.inputEl.addEventListener('keydown', this.onInputKeyDown.bind(this));

  this.options.map((option, index) => {
    const optionEl = document.createElement('div');
    optionEl.setAttribute('role', 'option');
    optionEl.id = `${this.idBase}-${index}`;
    optionEl.className = index === 0 ? 'combo-option option-current' : 'combo-option';
    optionEl.setAttribute('aria-selected', 'false');
    optionEl.innerText = option;

    optionEl.addEventListener('click', () => { this.onOptionClick(index); });
    optionEl.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

    this.listboxEl.appendChild(optionEl);
  });
}

ComboAutocomplete.prototype.filterOptions = function(value) {
  this.filteredOptions = filterOptions(this.options, value);

  // hide/show options based on filtering
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    const value = optionEl.innerText;
    if (this.filteredOptions.indexOf(value) > -1) {
      optionEl.style.display = 'block';
    }
    else {
      optionEl.style.display = 'none';
    }
  });
}

ComboAutocomplete.prototype.onInput = function() {
  const curValue = this.inputEl.value;
  const isDeleting = this.typedValue.toLowerCase().indexOf(curValue.toLowerCase()) === 0;
  this.filterOptions(curValue);

  // if active option is not in filtered options, set it to first filtered option
  if (this.filteredOptions.indexOf(this.options[this.activeIndex]) < 0) {
    const firstFilteredIndex = this.options.indexOf(this.filteredOptions[0]);
    this.onOptionChange(firstFilteredIndex);
  }

  // if not deleting && there are filtered options, autocomplete
  if (this.filteredOptions.length > 0 && !isDeleting && curValue.trim() !== '') {
    const activeName = this.filteredOptions[0];
    this.inputEl.value = activeName;
    this.inputEl.setSelectionRange(curValue.length, activeName.length);
  }

  this.typedValue = curValue;

  const menuState = this.filteredOptions.length > 0;
  if (this.open !== menuState) {
    this.updateMenuState(menuState, false);
  }
}

ComboAutocomplete.prototype.onInputKeyDown = function(event) {
  const { key } = event;

  const max = this.filteredOptions.length - 1;
  const activeFilteredIndex = this.filteredOptions.indexOf(this.options[this.activeIndex]);

  const action = getActionFromKey(key, this.open);

  switch(action) {
    case MenuActions.Next:
    case MenuActions.Last:
    case MenuActions.First:
    case MenuActions.Previous:
      event.preventDefault();
      const nextFilteredIndex = getUpdatedIndex(activeFilteredIndex, max, action);
      const nextRealIndex = this.options.indexOf(this.filteredOptions[nextFilteredIndex]);
      this.typedValue = '';
      return this.onOptionChange(nextRealIndex);
    case MenuActions.CloseSelect:
      event.preventDefault();
      this.selectOption(this.activeIndex);
      return this.updateMenuState(false);
    case MenuActions.Close:
      event.preventDefault();
      return this.updateMenuState(false);
    case MenuActions.Open:
      return this.updateMenuState(true);
  }
}

ComboAutocomplete.prototype.onInputBlur = function() {
  if (this.ignoreBlur) {
    this.ignoreBlur = false;
    return;
  }

  this.typedValue = '';
  if (this.open) {
    if (this.inputEl.value !== '') {
      this.selectOption(this.activeIndex);
    }
    this.updateMenuState(false, false);
  }
}

ComboAutocomplete.prototype.onOptionChange = function(index) {
  this.activeIndex = index;
  this.inputEl.setAttribute('aria-activedescendant', `${this.idBase}-${index}`);
  this.inputEl.value = this.options[index];

  // update active style
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.classList.remove('option-current');
  });
  options[index].classList.add('option-current');

  if (this.open && isScrollable(this.listboxEl)) {
    maintainScrollVisibility(options[index], this.listboxEl);
  }
}

ComboAutocomplete.prototype.onOptionClick = function(index) {
  this.onOptionChange(index);
  this.selectOption(index);
  this.updateMenuState(false);
}

ComboAutocomplete.prototype.onOptionMouseDown = function() {
  this.ignoreBlur = true;
}

ComboAutocomplete.prototype.selectOption = function(index) {
  const selected = this.options[index];
  this.inputEl.value = selected;
  this.activeIndex = index;
  this.typedValue = '';
  this.filterOptions(selected);

  // update aria-selected
  const options = this.el.querySelectorAll('[role=option]');
  [...options].forEach((optionEl) => {
    optionEl.setAttribute('aria-selected', 'false');
  });
  options[index].setAttribute('aria-selected', 'true');
}

ComboAutocomplete.prototype.updateMenuState = function(open, callFocus = true) {
  this.open = open;

  this.comboEl.setAttribute('aria-expanded', `${open}`);
  open ? this.el.classList.add('open') : this.el.classList.remove('open');
  callFocus && this.inputEl.focus();
}

// init combo
// const autocompleteEl = document.querySelector('.js-autocomplete');
// const autocompleteComponent = new ComboAutocomplete(autocompleteEl, options);
// autocompleteComponent.init();
