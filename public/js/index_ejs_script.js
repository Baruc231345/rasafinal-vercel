const registerBtn = document.getElementById("register");
const loginContainer = document.querySelector(".logincontainer");
const registerContainer = document.querySelector(".logincontainer2");
const success = document.getElementById('success');
const danger = document.getElementById('danger');

const navbarButton = document.getElementById('navbar-toggle-button');
const calendarContainer = document.getElementById('calendar');


registerBtn.addEventListener("click", function(event) {
    event.preventDefault()
    window.location.href = "/newregister";
});
form.addEventListener("submit", () => {
    success.style.display = 'none';
    danger.style.display = 'block'; 
    const login = {
        email: name1.value,
        password: pass.value
    };
    fetch("/api/login", {
        method: "POST", 
        body: JSON.stringify(login),
        headers: {
            "Content-type": "application/json"
        }
    }).then(res => res.json())
        .then(data => {
            if (data.status === "error") {
                danger.style.display = 'block'; 
                danger.innerText = data.error;
            } else {
                window.location.href = data.dashboardUrl;
                success.style.display = 'block';
                success.innerText = data.success;
            }
        });
});