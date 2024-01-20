const tableBody = document.getElementById("user-table").getElementsByTagName('tbody')[0];
fetch("/api/rasa_view")
  .then((response) => {
    if (!response.ok) {
      console.error("Error response:", response.status);
      return;
    }
    return response.json();
  })
  .then((data) => {
    data.forEach((entry) => {
      const row = document.createElement("tr");
      const fullNameCell = document.createElement("td");
      const eventNameCell = document.createElement("td");
      const eventDescriptionCell = document.createElement("td");
      const eventDayCell = document.createElement("td");
      const startTimeCell = document.createElement("td");
      const endTimeCell = document.createElement("td");
      const rasaStatusCell = document.createElement("td");
      const actionsCell = document.createElement("td");

      fullNameCell.textContent = entry.full_name;
      eventNameCell.textContent = entry.event_name;
      eventDescriptionCell.textContent = entry.event_description;
      eventDayCell.textContent = entry.event_day;
      startTimeCell.textContent = entry.start_time;
      endTimeCell.textContent = entry.end_time;
      rasaStatusCell.textContent = entry.rasa_status;

      if (entry.form_sign !== null && entry.form_sign2 !== null) {
        const confirmButton = document.createElement("button");
        confirmButton.textContent = "Confirm";
        confirmButton.classList.add("btn", "btn-sm", "btn-primary");
        confirmButton.onclick = () => {
          console.log("Confirm button clicked for ID:", entry.id);
        };
        actionsCell.appendChild(confirmButton);
      } else if (entry.pending === 1) {
        const disableButton = document.createElement("button");
        disableButton.textContent = "Disable";
        disableButton.classList.add("btn", "btn-sm", "btn-primary");
        disableButton.onclick = () => {
          console.log("Disable button clicked for ID:", entry.id);
        };
        actionsCell.appendChild(disableButton);
      } else {
        const approvedButton = document.createElement("button");
        approvedButton.textContent = "Approved";
        approvedButton.classList.add("btn", "btn-sm", "btn-primary");
        approvedButton.onclick = () => {
          console.log("Approved button clicked for ID:", entry.id);
        };
        actionsCell.appendChild(approvedButton);
      }
      row.appendChild(fullNameCell);
      row.appendChild(eventNameCell);
      row.appendChild(eventDescriptionCell);
      row.appendChild(eventDayCell);
      row.appendChild(startTimeCell);
      row.appendChild(endTimeCell);
      row.appendChild(rasaStatusCell);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });

  function confirmAction(id, event_name, event_day, event_description, required_day, start_time,
    end_time, auditorium, foodandbeverage, multihall, dancestudio, gym, classroom, classroom_number, kitchen, mainlobby,
    chair_quantity, table_quantity, microphone_quantity, lcd_quantity, widescreen_quantity, blackpanel_quantity,
    whiteboard_quantity, sound_system_quantity) {
    console.log("confirmAction clicked!");
    console.log("id:", id);
    console.log("event_name:", event_name);
    console.log("event_day:", event_day);
    console.log("event_description:", event_description);
    console.log("required_day:", required_day);
    console.log("start_time:", start_time);
    console.log("end_time:", end_time);
    console.log("chair_quantity:", chair_quantity);
    console.log("table_quantity:", table_quantity);
    console.log("microphone_quantity:", microphone_quantity);
    console.log("lcd_quantity:", lcd_quantity);
    console.log("widescreen_quantity:", widescreen_quantity);
    console.log("blackpanel_quantity:", blackpanel_quantity);
    console.log("whiteboard_quantity:", whiteboard_quantity);
    console.log("sound_system_quantity:", sound_system_quantity);
    console.log("gym:", gym);
    console.log("classroom:", classroom);
    console.log("classroom_number:", classroom_number);
    console.log("kitchen:", kitchen);
    console.log("mainlobby:", mainlobby);
    console.log("dancestudio:", dancestudio);
    console.log("multihall:", multihall);
    console.log("foodandbeverage:", foodandbeverage);
    console.log("auditorium:", auditorium);
    const fetchDate = new Date(event_day);
  
    // Extract year, month, and day
    const year = fetchDate.getFullYear();
    const month = fetchDate.getMonth() + 1; 
    const day = fetchDate.getDate();
    
    // Format the date as yyyy/mm/dd
    const formattedEventDay = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const calendarInput = {
      id: id,
      event_name: event_name,
      event_day: formattedEventDay,
      event_description: event_description,
      required_day: required_day,
      start_time: start_time,
      end_time: end_time,
      chair_quantity: chair_quantity,
      table_quantity: table_quantity,
      lcd_quantity: lcd_quantity,
      widescreen_quantity: widescreen_quantity,
      blackpanel_quantity: blackpanel_quantity,
      whiteboard_quantity: whiteboard_quantity,
      sound_system_quantity: sound_system_quantity,
      gym: gym, 
      classroom: classroom, 
      classroom_number: classroom_number, 
      kitchen: kitchen, 
      mainlobby: mainlobby, 
      dancestudio: dancestudio, 
      multihall: multihall, 
      foodandbeverage: foodandbeverage, 
      auditorium: auditorium,
    };
  
    console.log(calendarInput);
  
    fetch("/api/calendarInput", {
      method: "POST",
      body: JSON.stringify(calendarInput),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Response from API:", data);
        if (data.message === "Data inserted successfully") {
          const rowToRemove = document.querySelector(`tr[data-id="${id}"]`);
          if (rowToRemove) {
            rowToRemove.remove();
          }
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });

  fetch(`/api/updateAuthenticated/${id}`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      return res.json();
    })
    .then((data) => {
      alert("Authenticated updated successfully:", data);
  
      window.location.href = "/dashboardAdmin";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  }