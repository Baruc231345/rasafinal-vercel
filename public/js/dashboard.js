register.addEventListener("click",function(){
    window.location.href = '/';
  });
  const list = document.getElementById("list");
  const listItems = list.getElementsByTagName("li");
  listItems[0].classList.add("highlight");
  for (let i = 0; i < listItems.length; i++) {
        listItems[i].addEventListener("click", function() {
          for (let j = 0; j < listItems.length; j++) {
            listItems[j].classList.remove("highlight");      
          }       
          this.classList.add("highlight");
          if(i == listItems.length - 1){
            alert("You would be logged out!!");
            window.location.assign("index.html");
          }
        });
      };
      {
    const list = document.getElementById("list"); 
    const listItems = list.getElementsByTagName("li"); 
    listItems[1].classList.add("highlight");    
    for (let i = 0; i < listItems.length; i++) {
          listItems[i].addEventListener("click", function() {
            // Remove the "active" class from all list items
            for (let j = 0; j < listItems.length; j++) {
              listItems[j].classList.remove("highlight");        
            }
            // Add the "active" class to the clicked list item
            this.classList.add("highlight");
    
            if(i == listItems.length - 1){
              alert("You would be logged out!!");
              window.location.assign("index.html");
            }
          });    
        };
      }
