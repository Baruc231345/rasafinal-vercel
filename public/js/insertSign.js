const image_input = document.querySelector("#image_input");

image_input.addEventListener("change", function() {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const upload_image = reader.result;
    document.querySelector("#form_sign").style.backgroundImage = `url(${upload_image})`;
  });
  reader.readAsDataURL(this.files[0]);
});

const myForm = document.querySelector("#myForm");
myForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(myForm);
  fetch("/api/insertSign", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error(error);
    });
});
