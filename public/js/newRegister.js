const registerBtn = document.getElementById("register");
const registerContainer = document.querySelector(".logincontainer");
const regBtn_register = document.getElementById("regBtn_register");
const success = document.getElementById("success");
const danger = document.getElementById("danger");
const form = document.getElementById("form");
const toggleIcon = document.getElementById("toggleIcon"); // Define toggleIcon

regBtn_register.addEventListener("click", function (event) {
  event.preventDefault();
  window.location.href = "/";
});

form.addEventListener("submit", () => {
  const reg_name = document.getElementById("reg_name");
  const reg_fullname = document.getElementById("reg_fullname");
  const reg_pass = document.getElementById("reg_pass");
  const reg_user = document.getElementById("reg_user");
  const reg_course = document.getElementById("reg_course");
  const reg_contactnumber = document.getElementById("reg_contactnumber");
  const reg_requestor = document.getElementById("reg_requestor")

  const domain = "@globalcity.sti.edu.ph"
  const reg_name2 = reg_name.value + domain
  const confirm_pass = document.getElementById("confirm_pass");
  console.log("combi", reg_name2)
  console.log(reg_name.value)
  console.log(reg_pass.value)
  console.log(confirm_pass.value)
  console.log(reg_contactnumber.value)
  console.log(reg_requestor.value)

  if (reg_pass.value !== confirm_pass.value) {
    alert("Password is not the same");
    return;
  } else {
    const register = {
      email: reg_name2,
      password: reg_pass.value,
      user_id: reg_user.value,
      contact_number: reg_contactnumber.value,
      requestor: reg_requestor.value,
      course: reg_course.value,
      full_name: reg_fullname.value,
    };
    fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(register),
      headers: {
        "Content-type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status == "error") {
          danger.style.display = "block";
          danger.innerText = data.error;
        } else {
          success.style.display = "block";
          success.innerText = data.success;
        }
      });
  }
});

function togglePassword(inputId) {
  const passwordInput = document.getElementById(inputId);
  const passwordToggle = document.querySelector(
    `#${inputId} + .password-toggle`
  );
  const type = passwordInput.type === "password" ? "text" : "password";
  passwordInput.type = type;
  passwordToggle.classList.toggle("active", type === "text");
}

function updateUsername(inputField) {
    if (inputField instanceof HTMLInputElement) {
      const inputValue = inputField.value.trim();
      if (inputValue !== "") {
        const domain = "@globalcity.sti.edu.ph";
        const updatedValue = inputValue + domain;
        inputField.value = updatedValue;
      }
    }
  }


    function changeLabel() {
      var requestorDropdown = document.getElementById("reg_requestor");
      var courseLabel = document.getElementById("reg_courseLabel");
      var courseDropdown = document.getElementById("reg_course");

      if (requestorDropdown.value === "teacher") {
        courseLabel.innerHTML = "Department:";
      } else {
        courseLabel.innerHTML = "Course:";
      }
    }
