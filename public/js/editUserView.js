form.addEventListener("submit",() => {
  const editUserView = {
      email: email.value,
      password: password.value,
      role: role.value
  }
  fetch("/api/editUserView", {
      method: "POST", 
      body: JSON.stringify(editUserView),
      headers: {
          "Content-type": "application/json"
      }
  }).then(res => res.json())
      .then(data => {
          if (data.status == "error"){
              success.style.display = "none"
              error.style.display = "block"
              error.innerText = data.error
          } else {
              success.style.display = "block"
              error.style.display = "none"
              success.innerText = data.success
          }
      })
})
