const tableBody = document.querySelector("#user-table tbody");

fetch("/api/users")
  .then(response => response.json())
  .then(data => {
    data.forEach(user => {
      const row = document.createElement("tr");
      const idCell = document.createElement("td");
      const usernameCell = document.createElement("td");
      const passwordCell = document.createElement("td");
      const roleCell = document.createElement("td");
      idCell.textContent = user.id;
      usernameCell.textContent = user.email;
      passwordCell.textContent = user.password;
      roleCell.textContent = user.role;
      row.appendChild(idCell);
      row.appendChild(usernameCell);
      row.appendChild(passwordCell);
      row.appendChild(roleCell);
      tableBody.appendChild(row);
    });
  });

const passwordCells = document.querySelectorAll('#user-table td:nth-child(3)');
passwordCells.forEach(cell => {
  const password = cell.innerText;
  const asterisks = '*'.repeat("8");
  cell.innerText = asterisks;
});

function approveUser(id) {
  fetch("/approve/${id}", {
    method: 'PUT'
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      location.reload();
    } else {
      console.log(data.error);
    }
  })
  .catch(error => console.error(error));
}
