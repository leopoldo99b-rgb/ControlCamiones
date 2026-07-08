/*=========================================
        MENU RESPONSIVE
=========================================*/

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

if(menuBtn){

    menuBtn.addEventListener("click",()=>{

        sidebar.classList.toggle("show");

    });

}



document.addEventListener("click",(e)=>{

    if(
        sidebar &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
    ){

        sidebar.classList.remove("show");

    }

});



/*=========================================
        ANIMACION CARDS
=========================================*/

const cards = document.querySelectorAll(".card");

const observer = new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("visible");

        }

    });

},{
    threshold:.2
});

cards.forEach(card=>observer.observe(card));



/*=========================================
        EFECTO 3D
=========================================*/

cards.forEach(card=>{

    card.addEventListener("mousemove",(e)=>{

        const rect=card.getBoundingClientRect();

        const x=e.clientX-rect.left;

        const y=e.clientY-rect.top;

        const centerX=rect.width/2;

        const centerY=rect.height/2;

        const rotateX=-(y-centerY)/18;

        const rotateY=(x-centerX)/18;

        card.style.transform=

        `
        perspective(1200px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-15px)
        scale(1.03)
        `;

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="";

    });

});



/*=========================================
        BRILLO SIGUIENDO EL MOUSE
=========================================*/

cards.forEach(card=>{

    const glow=document.createElement("div");

    glow.className="glow";

    card.appendChild(glow);

    card.addEventListener("mousemove",(e)=>{

        const rect=card.getBoundingClientRect();

        glow.style.left=(e.clientX-rect.left)+"px";

        glow.style.top=(e.clientY-rect.top)+"px";

    });

});



/*=========================================
        EFECTO HERO
=========================================*/

const hero=document.querySelector(".hero");

window.addEventListener("mousemove",(e)=>{

    const x=(e.clientX/window.innerWidth-.5)*20;

    const y=(e.clientY/window.innerHeight-.5)*20;

    hero.style.backgroundPosition=

    `${50+x}% ${50+y}%`;

});



/*=========================================
        EFECTO FLOTANTE
=========================================*/

const floating=document.querySelectorAll(".hero-left,.hero-right");

window.addEventListener("scroll",()=>{

    let scroll=window.scrollY;

    floating.forEach((item,index)=>{

        let speed=(index+1)*0.15;

        item.style.transform=

        `translateY(${scroll*speed}px)`;

    });

});



/*=========================================
        EFECTO BOTONES
=========================================*/

document.querySelectorAll(".card-footer a").forEach(btn=>{

    btn.addEventListener("mouseenter",()=>{

        btn.style.transform="scale(1.05)";

    });

    btn.addEventListener("mouseleave",()=>{

        btn.style.transform="scale(1)";

    });

});



/*=========================================
        CONTADOR HERO
=========================================*/

const badge=document.querySelector(".badge");

if(badge){

    badge.animate([

        {
            transform:"translateY(0px)"
        },

        {
            transform:"translateY(-8px)"
        },

        {
            transform:"translateY(0px)"
        }

    ],{

        duration:2500,

        iterations:Infinity

    });

}



/*=========================================
        EFECTO GLOW
=========================================*/

const style=document.createElement("style");

style.innerHTML=`

.glow{

position:absolute;

width:220px;

height:220px;

background:radial-gradient(circle,
rgba(255,255,255,.35),
transparent 70%);

transform:translate(-50%,-50%);

pointer-events:none;

opacity:0;

transition:.25s;

}

.card:hover .glow{

opacity:1;

}

`;

document.head.appendChild(style);