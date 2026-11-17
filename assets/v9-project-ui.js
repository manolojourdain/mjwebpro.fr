const company=document.querySelector('.optional-company');
const large=matchMedia('(min-width:768px)');
function sync(){if(large.matches)company.open=true;else if(!company.querySelector('input').value)company.open=false;}
sync();large.addEventListener('change',sync);
