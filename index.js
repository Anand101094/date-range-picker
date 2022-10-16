/* 

// Additional config object can be passed to customise the Date Range Picker
// For E.g;

const config = {
  lang: 'ko',                 // change the calendar language (korean)
  onApply: (data) => {},      // callback function on clicking Apply, receives the date range Data in params
  onClose: (data) => {},      // callback function on closing the calendar popup, receives the date range Data in params
  maxDate: new Date(),        // max Date after which Calendar would be disabled. 
  format: 'MMMM DD, YYYY',    // Date format to appear in button label
  customOption: [             // Add or remove below options to update calendar popup customised date section
    "24hour",
    "week",
    "30days",
    "3months",
    "6months",
    "1year",
  ]
}

// Initialise the date range picker
// First param is container element where date range will be placed.
// Second param is optional config object.

// Listen for date-range-event (custom event) on container to get the required data on clicking Apply
// Listen for clear-date-range-event (event) on container when clearing the filter


new DateRangePicker(elem, config).init();

*/

function getWeekNumber(date) {
  const firstDayOfTheYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfTheYear) / 86400000;

  return Math.ceil((pastDaysOfYear + firstDayOfTheYear.getDay() + 1) / 7);
}

function isLeapYear(year) {
  return year % 100 === 0 ? year % 400 === 0 : year % 4 === 0;
}

class Day {
  constructor(date = null, lang = "default") {
    date = date ?? new Date();

    this.Date = date;
    this.date = date.getDate();
    this.day = date.toLocaleString(lang, { weekday: "long" });
    this.dayNumber = date.getDay() + 1;
    this.dayShort = date.toLocaleString(lang, { weekday: "short" });
    this.year = date.getFullYear();
    this.yearShort = date.toLocaleString(lang, { year: "2-digit" });
    this.month = date.toLocaleString(lang, { month: "long" });
    this.monthShort = date.toLocaleString(lang, { month: "short" });
    this.monthNumber = date.getMonth() + 1;
    this.timestamp = date.getTime();
    this.week = getWeekNumber(date);
  }

  get isToday() {
    return this.isEqualTo(new Date());
  }

  isEqualTo(date) {
    date = date instanceof Day ? date.Date : date;

    return (
      date.getDate() === this.date &&
      date.getMonth() === this.monthNumber - 1 &&
      date.getFullYear() === this.year
    );
  }

  format(formatStr) {
    return formatStr
      .replace(/\bYYYY\b/, this.year)
      .replace(/\bYYY\b/, this.yearShort)
      .replace(/\bWW\b/, this.week.toString().padStart(2, "0"))
      .replace(/\bW\b/, this.week)
      .replace(/\bDDDD\b/, this.day)
      .replace(/\bDDD\b/, this.dayShort)
      .replace(/\bDD\b/, this.date.toString().padStart(2, "0"))
      .replace(/\bD\b/, this.date)
      .replace(/\bMMMM\b/, this.month)
      .replace(/\bMMM\b/, this.monthShort)
      .replace(/\bMM\b/, this.monthNumber.toString().padStart(2, "0"))
      .replace(/\bM\b/, this.monthNumber);
  }
}

class Month {
  constructor(date = null, lang = "default") {
    const day = new Day(date, lang);
    const monthsSize = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    this.lang = lang;

    this.name = day.month;
    this.number = day.monthNumber;
    this.year = day.year;
    this.numberOfDays = monthsSize[this.number - 1];

    if (this.number === 2) {
      this.numberOfDays += isLeapYear(day.year) ? 1 : 0;
    }

    this[Symbol.iterator] = function* () {
      let number = 1;
      yield this.getDay(number);
      while (number < this.numberOfDays) {
        ++number;
        yield this.getDay(number);
      }
    };
  }

  getDay(date) {
    return new Day(new Date(this.year, this.number - 1, date), this.lang);
  }
}

class Calendar {
  weekDays = Array.from({ length: 7 });

  constructor(year = null, monthNumber = null, lang = "default") {
    this.today = new Day(null, lang);
    this.year = year ?? this.today.year;
    this.month = new Month(
      new Date(this.year, (monthNumber || this.today.monthNumber) - 1),
      lang
    );
    this.lang = lang;

    this[Symbol.iterator] = function* () {
      let number = 1;
      yield this.getMonth(number);
      while (number < 12) {
        ++number;
        yield this.getMonth(number);
      }
    };

    this.weekDays.forEach((_, i) => {
      const day = this.month.getDay(i + 1);
      if (!this.weekDays.includes(day.day)) {
        this.weekDays[day.dayNumber - 1] = day.day;
      }
    });
  }

  get isLeapYear() {
    return isLeapYear(this.year);
  }

  getMonth(monthNumber) {
    return new Month(new Date(this.year, monthNumber - 1), this.lang);
  }

  getPreviousMonth() {
    if (this.month.number === 1) {
      return new Month(new Date(this.year - 1, 11), this.lang);
    }

    return new Month(new Date(this.year, this.month.number - 2), this.lang);
  }

  getNextMonth() {
    if (this.month.number === 12) {
      return new Month(new Date(this.year + 1, 0), this.lang);
    }

    return new Month(new Date(this.year, this.month.number + 2), this.lang);
  }

  goToDate(monthNumber, year) {
    this.month = new Month(new Date(year, monthNumber - 1), this.lang);
    this.year = year;
  }

  goToNextYear() {
    this.year += 1;
    this.month = new Month(new Date(this.year, 0), this.lang);
  }

  goToPreviousYear() {
    this.year -= 1;
    this.month = new Month(new Date(this.year, 11), this.lang);
  }

  goToNextMonth() {
    if (this.month.number === 12) {
      return this.goToNextYear();
    }

    this.month = new Month(
      new Date(this.year, this.month.number + 1 - 1),
      this.lang
    );
  }

  goToPreviousMonth() {
    if (this.month.number === 1) {
      return this.goToPreviousYear();
    }

    this.month = new Month(
      new Date(this.year, this.month.number - 1 - 1),
      this.lang
    );
  }
}

class DateRangePicker {
  constructor(elem, config = {}) {
    const lang = config.lang || window.navigator.language || "en";
    this.currentLang = lang;
    this.initializeCalendarVariables(lang); // calendar variable initialisation
    this.onClose = config.onClose;
    this.onApply = config.onApply;
    this.maxDate = new Day(config.maxDate || new Date(), lang);
    this.format = config.format || "MMM DD, YYY";
    this.container = elem;
    this.startDate = null;
    this.endDate = null;

    this.customOption = config.customOption || [
      "24hour",
      "week",
      "30days",
      "3months",
      "6months",
      "1year",
    ];
    this.customOptionMapping = {
      "24hour": "Last 24 hours",
      week: "Last week",
      "30days": "Last 30 days",
      "3months": "Last 3 months",
      "6months": "Last 6 months",
      "1year": "Last 12 months",
    };
  }

  // calendar variables initialised (also used while resetting date range picker)
  initializeCalendarVariables(lang) {
    const date = new Date(Date.now());
    this.date = new Day(date, lang);
    this.calendarRight = new Calendar(
      this.date.year,
      this.date.monthNumber,
      lang
    );
    const prevMonth =
      this.date.monthNumber === 1 ? 12 : this.date.monthNumber - 1;
    const prevMonthYear =
      this.date.monthNumber === 1 ? this.date.year - 1 : this.date.year;
    this.calendarLeft = new Calendar(prevMonthYear, prevMonth, lang);
  }

  init() {
    if (!this.container) {
      console.log("Date range picker container missing");
      return;
    }
    this.render();
  }

  // date select functionality
  setDateRange = (day) => {
    // first selection
    if (!this.startDate) {
      this.startDate = day;
      this.updateCalendar();
      return;
    }

    //second forward selection
    if (!this.endDate && day.timestamp >= this.startDate.timestamp) {
      this.endDate = day;
      this.updateCustomisedOptions();
      this.updateCalendar();
      this.updateFooter();
      return;
    }

    //second backward selection
    if (!this.endDate && day.timestamp < this.startDate.timestamp) {
      this.endDate = this.startDate;
      this.startDate = day;
      this.updateCustomisedOptions();
      this.updateCalendar();
      this.updateFooter();
      return;
    }

    // selection before endDate
    if (day.timestamp <= this.endDate.timestamp) {
      this.startDate = day;
    } else {
      // selection after endDate
      this.endDate = day;
    }

    this.updateCustomisedOptions();
    this.updateCalendar();
    this.updateFooter();
  };

  moveToPreviousMonth = () => {
    this.calendarLeft.goToPreviousMonth();
    this.calendarRight.goToPreviousMonth();
    this.updateCalendar();
  };

  moveToNextMonth = () => {
    this.calendarLeft.goToNextMonth();
    this.calendarRight.goToNextMonth();
    this.updateCalendar();
  };

  getCalendar = () => {
    const calWrapper = document.createElement("div");
    calWrapper.classList.add("cmp-drp__cal-wrapper");

    const drpLeft = document.createElement("div");
    drpLeft.classList.add("cmp-drp__left");
    const leftCalendar = getCalendarPopup({
      calendar: this.calendarLeft,
      moveToPreviousMonth: this.moveToPreviousMonth,
      moveToNextMonth: this.moveToNextMonth,
      leftCalendar: true,
      startDate: this.startDate,
      endDate: this.endDate,
      maxDate: this.maxDate,
      setDateRange: this.setDateRange,
    });
    drpLeft.appendChild(leftCalendar);

    calWrapper.appendChild(drpLeft);

    const drpRight = document.createElement("div");
    drpRight.classList.add("cmp-drp__right");
    const rightCalendar = getCalendarPopup({
      calendar: this.calendarRight,
      moveToPreviousMonth: this.moveToPreviousMonth,
      moveToNextMonth: this.moveToNextMonth,
      rightCalendar: true,
      startDate: this.startDate,
      endDate: this.endDate,
      maxDate: this.maxDate,
      setDateRange: this.setDateRange,
    });
    drpRight.appendChild(rightCalendar);

    calWrapper.appendChild(drpRight);

    return calWrapper;
  };

  // update calendar view
  updateCalendar = () => {
    const updatedCalendars = this.getCalendar();
    const parentNode = this.container.querySelector(".cmp-drp__cal-sec");
    if (parentNode) {
      const oldCalendars = parentNode.querySelector(".cmp-drp__cal-wrapper");
      parentNode.replaceChild(updatedCalendars, oldCalendars);
    }
  };

  getCustomDates = (option) => {
    // normalizing the start and end date
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    switch (option) {
      case "24hour":
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "3months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        break;
    }

    return {
      startDate,
      endDate,
    };
  };

  setCustomDates = (option) => {
    const updatedDates = this.getCustomDates(option);

    this.startDate = new Day(updatedDates.startDate, this.currentLang);
    this.endDate = new Day(updatedDates.endDate, this.currentLang);

    this.updateCalendar();
    this.updateFooter();
  };

  handleCustomOptionClick = (e) => {
    if (e.target === e.currentTarget) {
      return;
    }

    e.currentTarget
      .querySelectorAll(".cmp-drp--custom-opt")
      .forEach((customOpt) => {
        customOpt.classList.remove("selected");
      });
    e.target.classList.add("selected");

    const option = e.target.dataset.custOpt;
    this.setCustomDates(option);
  };

  // update custom option view
  updateCustomisedOptions = () => {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    this.container
      .querySelectorAll(".cmp-drp--custom-opt")
      .forEach((customOpt) => {
        customOpt.classList.remove("selected");
      });

    if (this.startDate && this.endDate) {
      for (let i = 0; i < this.customOption.length; i++) {
        const option = this.customOption[i];
        let { startDate } = this.getCustomDates(option);
        const startDateMatch = startDate.getTime() === this.startDate.timestamp;
        const endDateMatch = today.getTime() === this.endDate.timestamp;
        if (startDateMatch && endDateMatch) {
          this.container
            .querySelector(`[data-cust-opt="${option}"]`)
            .classList.add("selected");
          return;
        }
      }
    }
  };

  getCustomisedOptions = () => {
    const custOptWrapper = document.createElement("div");
    custOptWrapper.classList.add("cmp-drp__custom-opt-wrapper");
    custOptWrapper.addEventListener("click", this.handleCustomOptionClick);

    this.customOption.forEach((custOpt) => {
      const custBtn = document.createElement("button");
      custBtn.classList.add("cmp-drp--custom-opt");
      custBtn.dataset.custOpt = custOpt;
      custBtn.innerText = `${this.customOptionMapping[custOpt] || custOpt}`;
      custOptWrapper.appendChild(custBtn);
    });

    return custOptWrapper;
  };

  // update Footer view
  updateFooter = () => {
    const parentNode = this.container.querySelector(".cmp-drp__footer");

    if (parentNode) {
      const enabled = this.startDate && this.endDate;
      const applyBtn = parentNode.querySelector(".cmp-drp--apply-btn");
      const clearBtn = parentNode.querySelector(".cmp-drp--clear-btn");
      if (enabled) {
        applyBtn.classList.remove("disabled");
        clearBtn.classList.remove("disabled");
      } else {
        applyBtn.classList.add("disabled");
        clearBtn.classList.add("disabled");
      }
    }
  };

  getEndOfDay = (day) => {
    if (day) {
      const date = new Date(day.timestamp);
      date.setHours(23, 59, 59, 999);
      return new Day(date);
    }
  };

  modalLoopAccessibility = (event) => {
    event.stopPropagation();

    if (event.keyCode === 9) {
      const modalOverlay = this.container.querySelector(
        ".cmp-drp__modal-overlay"
      );
      modalOverlay.focus();
    }
  };

  handleCTA = (e) => {
    const btn = e.target.dataset.btnType;
    switch (btn) {
      case "close":
        this.closeModal();
        break;

      case "apply":
        if (!this.startDate || !this.endDate) {
          return;
        }

        this.updateButtonLabel();
        this.toggleModal();
        const clearBtn = this.container.querySelector(".cmp-drp--date-clear");
        if (clearBtn) {
          clearBtn.classList.remove("hide");
        }

        const toggleBtn = this.container.querySelector(".cmp-drp--toggle");
        toggleBtn.classList.add("pl-space");

        // payload data created
        const endDateEndOfDay = this.getEndOfDay(this.endDate) || this.endDate;
        const rangeData = {
          startDate: this.startDate,
          endDate: endDateEndOfDay,
        };

        // custom event created in case of no callback function provided
        let dateRangeEvent = new CustomEvent("date-range-event", {
          bubbles: true,
          detail: { rangeData },
        });

        this.container.dispatchEvent(dateRangeEvent);

        // If callback function is provided during initialisation, invoke it.
        if (this.onApply) {
          this.onApply(rangeData);
        }

        break;

      case "clear":
        if (!this.startDate || !this.endDate) {
          return;
        }

        this.startDate = null;
        this.endDate = null;
        this.updateCustomisedOptions();
        this.updateFooter();
        break;

      case "default":
        break;
    }

    this.updateCalendar();
  };

  getFooter = () => {
    const enabled = this.startDate && this.endDate;

    const drpFooter = document.createElement("div");
    drpFooter.classList.add("cmp-drp__footer-wrapper");
    drpFooter.addEventListener("click", this.handleCTA);

    const closeBtn = document.createElement("button");
    closeBtn.dataset.btnType = "close";
    closeBtn.classList.add("cmp-drp--close-btn");
    closeBtn.classList.add("cmp-drp--cta-btn");
    closeBtn.innerText = "Close";
    drpFooter.appendChild(closeBtn);

    const applyBtn = document.createElement("button");
    applyBtn.dataset.btnType = "apply";
    applyBtn.classList.add("cmp-drp--apply-btn");
    applyBtn.classList.add("cmp-drp--cta-btn");
    if (!enabled) {
      applyBtn.classList.add("disabled");
    }
    applyBtn.innerText = "Apply";
    drpFooter.appendChild(applyBtn);

    const clearBtn = document.createElement("button");
    clearBtn.dataset.btnType = "clear";
    clearBtn.classList.add("cmp-drp--clear-btn");
    clearBtn.classList.add("cmp-drp--cta-btn");
    if (!enabled) {
      clearBtn.classList.add("disabled");
    }
    clearBtn.addEventListener("keydown", this.modalLoopAccessibility);
    clearBtn.innerText = "Clear";
    drpFooter.appendChild(clearBtn);

    return drpFooter;
  };

  // close Modal
  closeModal = () => {
    this.startDate = null;
    this.endDate = null;
    this.toggleModal();
  };

  // update toggle button label
  updateButtonLabel = () => {
    let label = "";
    if (this.startDate && this.endDate) {
      label =
        this.startDate.format(this.format) +
        " - " +
        this.endDate.format(this.format);
    }
    const dateLabel = this.container.querySelector(".cmp-drp--selected-date");
    const selectedRangeTimestamp = `${this.startDate.timestamp}-${this.endDate.timestamp}`;
    dateLabel.dataset.dateRange = selectedRangeTimestamp;
    dateLabel.innerText = label;
  };

  preFillSelectedState = () => {
    const dateLabel = this.container.querySelector(".cmp-drp--selected-date");
    const [startDate, endDate] = dateLabel.dataset.dateRange.split("-");
    if (startDate && endDate) {
      this.startDate = new Day(new Date(Number(startDate)), this.lang);
      this.endDate = new Day(new Date(Number(endDate)), this.lang);
    }
  };

  // clear dates and update date label
  clearFilter = (e) => {
    e.stopPropagation();
    this.startDate = null;
    this.endDate = null;
    const dateLabel = this.container.querySelector(".cmp-drp--selected-date");
    dateLabel.dataset.dateRange = "";
    dateLabel.innerText = "Select Range";
    const clearBtn = this.container.querySelector(".cmp-drp--date-clear");
    if (clearBtn) {
      clearBtn.classList.add("hide");
    }

    const toggleBtn = this.container.querySelector(".cmp-drp--toggle");
    toggleBtn.classList.remove("pl-space");

    let dateRangeEvent = new Event("clear-date-range-event");
    this.container.dispatchEvent(dateRangeEvent);

    // reset date range picker and update calendar
    this.initializeCalendarVariables(this.currentLang);
    this.updateCalendar();
  };

  toggleModal = () => {
    const modal = this.container.querySelector(".cmp-drp__modal-overlay");
    const isClosed = modal.classList.contains("hide");

    if (isClosed) {
      // prefill selected state and open the modal
      this.preFillSelectedState();
      this.updateCustomisedOptions();
      this.updateCalendar();
      this.updateFooter();
      modal.classList.remove("hide");
      document.body.style.overflow = "hidden";
    } else {
      // hide modal
      modal.classList.add("hide");
      document.body.style.overflow = "auto";
    }
  };

  render() {
    //  render the date range popup

    const drpModal = document.createElement("div");
    drpModal.classList.add("cmp-drp");

    const toggleBtn = document.createElement("button");
    toggleBtn.classList.add("cmp-drp--toggle");
    toggleBtn.setAttribute("aria-label", "Select Date Range");
    toggleBtn.addEventListener("click", this.toggleModal);

    const dateLabel = document.createElement("span");
    dateLabel.classList.add("cmp-drp--date-label");
    dateLabel.innerText = "Date Range:";
    toggleBtn.appendChild(dateLabel);

    const selDate = document.createElement("span");
    selDate.classList.add("cmp-drp--selected-date");
    selDate.dataset.dateRange = "";
    selDate.innerText = "Select Range";
    toggleBtn.appendChild(selDate);

    drpModal.appendChild(toggleBtn);

    const clearBtn = document.createElement("button");
    clearBtn.classList.add("cmp-drp--date-clear");
    clearBtn.classList.add("hide");
    clearBtn.addEventListener("click", this.clearFilter);

    drpModal.appendChild(clearBtn);

    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("cmp-drp__modal-overlay");
    modalOverlay.classList.add("hide");
    modalOverlay.setAttribute("tabindex", "0");

    const modalContent = document.createElement("div");
    modalContent.classList.add("cmp-drp__modal-content");

    const modalHeader = document.createElement("div");
    modalHeader.classList.add("cmp-drp__modal-header");

    const closeBtn = document.createElement("button");
    closeBtn.setAttribute("aria-label", "close date range picker");
    closeBtn.classList.add("cmp-drp--close-icon");
    closeBtn.addEventListener("click", this.closeModal);

    modalHeader.appendChild(closeBtn);
    modalContent.appendChild(modalHeader);

    const modalBody = document.createElement("div");
    modalBody.classList.add("cmp-drp__modal-body");

    const drpCustOpt = document.createElement("div");
    drpCustOpt.classList.add("cmp-drp__custom-opt-sec");
    const custOpt = this.getCustomisedOptions();
    drpCustOpt.appendChild(custOpt);

    modalBody.appendChild(drpCustOpt);

    const drpCal = document.createElement("div");
    drpCal.classList.add("cmp-drp__cal-sec");
    const cal = this.getCalendar();
    drpCal.appendChild(cal);

    modalBody.appendChild(drpCal);
    modalContent.appendChild(modalBody);

    const drpFooter = document.createElement("div");
    drpFooter.classList.add("cmp-drp__footer");
    const footer = this.getFooter();
    drpFooter.appendChild(footer);

    modalContent.appendChild(drpFooter);
    modalOverlay.appendChild(modalContent);
    drpModal.appendChild(modalOverlay);

    this.container.appendChild(drpModal);
  }
}

const getCalendarPopup = ({
  calendar,
  moveToPreviousMonth,
  moveToNextMonth,
  leftCalendar,
  rightCalendar,
  startDate,
  endDate,
  maxDate,
  setDateRange,
}) => {
  const { number, year, numberOfDays } = calendar.month;
  const curDate = new Date(year, number - 1);
  curDate.setDate(numberOfDays);
  curDate.setHours(23, 59, 59, 999);
  const lastDayTimestamp = curDate.getTime();

  const prevIconDisabled = false;
  const nextIconDisabled = maxDate.timestamp <= lastDayTimestamp;

  const getMonthDayHeader = () => {
    const drpHeader = document.createElement("div");
    drpHeader.classList.add("cmp-drp--header");

    const leftBtn = document.createElement("button");
    leftBtn.setAttribute("tabindex", "0");
    leftBtn.classList.add("cmp-drp--mv-left-icon");
    if (rightCalendar) {
      leftBtn.classList.add("hide");
    }
    if (prevIconDisabled) {
      leftBtn.classList.add("disabled");
    } else {
      leftBtn.addEventListener("click", moveToPreviousMonth);
    }
    drpHeader.appendChild(leftBtn);

    const calTitle = document.createElement("div");
    calTitle.classList.add("cmp-drp--cal-title");
    calTitle.innerText = `${calendar.month.name}  ${calendar.month.year}`;
    drpHeader.appendChild(calTitle);

    const rightBtn = document.createElement("button");
    rightBtn.setAttribute("tabindex", "0");
    rightBtn.classList.add("cmp-drp--mv-right-icon");
    if (leftCalendar) {
      rightBtn.classList.add("hide");
    }
    if (nextIconDisabled) {
      rightBtn.classList.add("disabled");
    } else {
      rightBtn.addEventListener("click", moveToNextMonth);
    }
    drpHeader.appendChild(rightBtn);

    return drpHeader;
  };

  const getWeekDaysHeader = () => {
    return calendar.weekDays.map((weekday) => {
      const node = document.createElement("span");
      node.classList.add("mth-name");
      node.innerText = weekday.substring(0, 3);
      return node;
    });
  };

  const wrapperNode = document.createElement("div");
  wrapperNode.classList.add("cmp-drp__wrapper");

  const monthDayHeader = getMonthDayHeader();
  wrapperNode.appendChild(monthDayHeader);

  const drpWeekDays = document.createElement("div");
  drpWeekDays.classList.add("cmp-drp__week-days");
  const weekDaysHeader = getWeekDaysHeader();
  weekDaysHeader.forEach((weekDays) => {
    drpWeekDays.appendChild(weekDays);
  });

  wrapperNode.appendChild(drpWeekDays);

  const month = getMonthDays({
    calendar: calendar,
    startDate: startDate,
    endDate: endDate,
    maxDate: maxDate,
    setDateRange: setDateRange,
  });

  wrapperNode.appendChild(month);
  return wrapperNode;
};

const getMonthDays = ({
  calendar,
  startDate,
  endDate,
  setDateRange,
  maxDate,
}) => {
  const handleClick = (e) => {
    const button = e.target;
    // if button is disabled, do nothing
    if (
      button.classList.contains("disabled") ||
      button.classList.contains("opc-0")
    ) {
      return;
    }

    // If button is actual date, set the date range
    const date = button.dataset.date;
    const day = calendar.month.getDay(date);
    if (date && button.classList.contains("mth-d")) {
      setDateRange(day);
    }
  };

  const getMonthDaysGrid = (month) => {
    const firstDayOfTheMonth = month.getDay(1);
    const totalLastMonthFinalDays = firstDayOfTheMonth.dayNumber - 1;
    const totalDays = month.numberOfDays + totalLastMonthFinalDays;
    const monthList = Array.from({ length: totalDays });

    for (let i = totalLastMonthFinalDays; i < totalDays; i++) {
      monthList[i] = month.getDay(i + 1 - totalLastMonthFinalDays);
    }

    return monthList;
  };

  const isSelected = (day) => {
    if (day && startDate && day.timestamp === startDate.timestamp) {
      return true;
    }

    if (day && endDate && day.timestamp === endDate.timestamp) {
      return true;
    }
    return false;
  };

  const isWithinRange = (day) => {
    if (
      day &&
      startDate &&
      endDate &&
      startDate.timestamp < day.timestamp &&
      day.timestamp < endDate.timestamp
    ) {
      return true;
    }
    return false;
  };

  const getDisabledState = (day) => {
    if (day.timestamp > maxDate.timestamp) {
      return true;
    }
    return false;
  };

  const monthDayGrid = getMonthDaysGrid(calendar.month);

  const monthDaysWrapper = document.createElement("div");
  monthDaysWrapper.classList.add("cmp-drp__month-days");
  monthDaysWrapper.addEventListener("click", handleClick);

  monthDayGrid.forEach((day = "") => {
    const text = day.date || "";
    const selectClass = isSelected(day) ? "selected" : "";
    const isInRange = isWithinRange(day) ? "in-range" : "";
    const isDisbaled = getDisabledState(day) ? "disabled" : "";

    const dayBtn = document.createElement("button");
    dayBtn.setAttribute("tabindex", `${text && !isDisbaled ? "0" : "-1"}`);
    dayBtn.dataset.date = text;
    dayBtn.classList.add("mth-d");
    if (!text) {
      dayBtn.classList.add("opc-0");
    }

    if (selectClass) {
      dayBtn.classList.add(selectClass);
    }
    if (isInRange) {
      dayBtn.classList.add(isInRange);
    }
    if (isDisbaled) {
      dayBtn.classList.add(isDisbaled);
    }

    dayBtn.innerText = text;
    monthDaysWrapper.appendChild(dayBtn);
  });

  return monthDaysWrapper;
};

export default DateRangePicker;

window.DateRangePicker = DateRangePicker;
