// ==========================================
// MOBILE MENU
// ==========================================

const menuBtn = document.getElementById("menuBtn");

const navLinks = document.querySelector(".nav-links");
const navButtons = document.querySelector(".nav-buttons");

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        if (navLinks.style.display === "flex") {

            navLinks.style.display = "none";
            navButtons.style.display = "none";

        } else {

            navLinks.style.display = "flex";
            navButtons.style.display = "flex";

            navLinks.style.flexDirection = "column";
            navLinks.style.position = "absolute";
            navLinks.style.top = "76px";
            navLinks.style.left = "0";
            navLinks.style.width = "100%";
            navLinks.style.padding = "25px";

            navLinks.style.background = "white";

            navButtons.style.position = "absolute";
            navButtons.style.top = "280px";
            navButtons.style.left = "0";
            navButtons.style.width = "100%";
            navButtons.style.padding = "20px 25px";

            navButtons.style.background = "white";

        }

    });

}


// ==========================================
// ACTIVE NAVIGATION
// ==========================================

const sections = document.querySelectorAll("section");
const links = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop;

        if (window.scrollY >= sectionTop - 150) {

            current = section.getAttribute("id");

        }

    });

    links.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");

        }

    });

});