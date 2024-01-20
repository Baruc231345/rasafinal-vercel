form.addEventListener("submit",() => {
    const register = {
        email: email.value,
        password: password.value,
        role: "regular"
    }       
    fetch("/api/register", {
        method: "POST",
        body: JSON.stringify(register),
        headers: {
            "Content-type": "application/json"
        }
    }) .then(res => res.json())
        .then(data => {
            if (data.status == "error"){
                success.style.display = "none"
                error.style.display = "block"
            } else{
                success.style.display = "block"
                error.style.display = "none"
            }
        })
})