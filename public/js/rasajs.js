const checkbox = document.getElementById('myRadioId-6');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');

checkbox.addEventListener('change', function() {  
  if (this.checked) {
    startTimeInput.disabled = false;
    endTimeInput.disabled = false;
  } else {
    startTimeInput.disabled = true;
    endTimeInput.disabled = true;
  }
});

checkbox.addEventListener('change', function() {
  if (!this.checked) {
    startTimeInput.value = '';
    endTimeInput.value = '';
  }
});

