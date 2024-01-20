const navbarButton = document.getElementById('navbar-toggle-button');
const calendarContainer = document.getElementById('calendar');

navbarButton.addEventListener('click', () => {
  calendarContainer.classList.toggle('expanded');
});


const addEventBtn = document.getElementById('add-event-btn');
addEventBtn.addEventListener('click', () => {
  const title = prompt('Enter event title:');
  const description = prompt('Enter event description:');
  const dateStr = prompt('Enter event date (YYYY-MM-DD):');
  const [year, month, day] = dateStr.split('-');

  if (title && description && year && month && day) { 
    const date = new Date(year, month - 1, day); // Month is zero-based
    const event = {
      date,
      title,
      description
    };

    events.push(event);
    addEventsToCalendar(events);
    displayCalendarDates(currentMonth, currentYear); // Add this line
  } else {
    alert('Invalid input. Please try again.');
  }
});

function getCalendarDates(month, year) {
  const dates = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();

  let currentWeek = [];
  for (let i = 0; i < 7; i++) {
    if (i < firstDay.getDay()) {
      currentWeek.push('');
    } else {
      currentWeek.push(new Date(year, month, i - firstDay.getDay() + 1));
    }
  }
  dates.push(currentWeek);

  let currentDay = currentWeek[currentWeek.length - 1].getDate() + 1;
  while (currentDay <= numDays) {
    currentWeek = [];
    for (let i = 0; i < 7; i++) {
      if (currentDay <= numDays) {
        currentWeek.push(new Date(year, month, currentDay));
        currentDay++;
      } else {
        currentWeek.push('');
      }
    }
    dates.push(currentWeek);
  }

  return dates;
}

function displayCalendarDates(month, year) {
  const dates = getCalendarDates(month, year);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });
  document.getElementById('month').textContent = monthName;

  const tbody = document.querySelector('tbody');
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }
  dates.forEach((week) => {
    const tr = document.createElement('tr');
    week.forEach((date) => {
      const td = document.createElement('td');
      if (date instanceof Date && date.getMonth() === month && date.getFullYear() === year) {
        td.textContent = date.getDate();
        td.classList.add('calendar-date'); // Add the "calendar-date" class to date cells
        if (date.toDateString() === new Date().toDateString()) {
          td.classList.add('today');
        }
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  addEventsToCalendar(events);

      // Add click event listener to date cells
  const dateCells = document.querySelectorAll('.calendar-date');
  dateCells.forEach((cell) => {
    cell.addEventListener('click', () => {
      const clickedDate = new Date(year, month, cell.textContent);
      // Redirect to the other page with the clicked date information
      window.location.href = `/other-page?date=${clickedDate.toISOString()}`;
    });
  });
}


const now = new Date();
let currentMonth = now.getMonth();
let currentYear = now.getFullYear();
displayCalendarDates(currentMonth, currentYear);

const prevBtn = document.getElementById('prev-btn');
prevBtn.addEventListener('click', () => {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear--;
  } else {
    currentMonth--;
  }
  displayCalendarDates(currentMonth, currentYear);
});

const nextBtn = document.getElementById('next-btn');
nextBtn.addEventListener('click', () => {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear++;
  } else {
    currentMonth++;
  }
  displayCalendarDates(currentMonth, currentYear);
});

function EventsToCalendar(events) {
  const tableCells = document.querySelectorAll(".calendar-date");

  // Clear existing events
  tableCells.forEach((cell) => {
    while (cell.firstChild) {
      cell.removeChild(cell.firstChild);
    }
  });

  events.forEach((event) => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date);
    endDate.setDate(endDate.getDate() + 1); // Add one day to the start date
    const eventTitle = event.title;
    const eventDescription = event.description;

    let currentDay = startDate;
    while (currentDay < endDate) {
      const date = currentDay.getDate();
      const month = currentDay.getMonth();
      const year = currentDay.getFullYear();

      // Check if the event date matches the current month and year
      if (month === currentMonth && year === currentYear &&date === currentDay.getDate()) {
        // Find the table cell corresponding to the date of the event
        const cell = Array.from(tableCells).find((td) => {
          const tdDate = new Date(year, month, td.textContent);
          return tdDate.getTime() === currentDay.getTime();
        });

        if (cell) {
          // If the cell is found, create and append the event div
          const eventDiv = document.createElement("div");
          eventDiv.classList.add("event");
          eventDiv.style.background = "#779ECB";
          eventDiv.style.color = "white";
          eventDiv.style.textAlign = "center";
          eventDiv.style.padding = "0.1px";
          if (cell.textContent != date) {
            // Display the date in the event div only if it's different from the cell's date
            eventDiv.innerHTML = `<p class="event-date">${date}</p>`;
          }
          eventDiv.innerHTML += `<p class="event-title">${eventTitle}</p><p class="event-description">${eventDescription}</p>`;

          // Add click event listener to the event div
          eventDiv.addEventListener('click', () => {
            const clickedDate = currentDay.toISOString();
            // Redirect to the other page with the clicked date information
            window.location.href = `/other-page?date=${clickedDate}`;
          });

          if (cell.children.length > 0) {
            // If the cell already has events, append the new event div after the existing ones
            cell.insertBefore(eventDiv, cell.firstChild.nextSibling);
          } else {
            // Otherwise, append the event div as the first child
            cell.appendChild(eventDiv);
          }
        }
      }

      currentDay.setDate(currentDay.getDate() + 1); // Move to the next day
    }
  });
}