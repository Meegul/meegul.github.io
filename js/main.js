window.onload = () => {
    const canvas = document.getElementById("particle-canvas");
    new Particles({
        walled: false,
        gravity: true,
        falling: false, 
        telportWalls: true,
        interactive: false,
        repel: false,
        particleColor: "rgb(255,255,255)",
        backgroundColor: "rgba(15,15,15,100)",
        connected: false,
        random: {
            number: 250,
            minMass: 0.15,
            maxMass: 0.3,
            minDx: -0.3,
            maxDx: 0.3,
            minDy: -0.3,
            maxDy: 0.3,
        },
    }, canvas).start();
};

const toggleContent = () => {
    const contentEl = document.getElementById("content");
    const maskEl = document.getElementById("backgroundMask");
    const buttonEl = document.getElementById("contentToggle");
    if (contentEl.style.display) {
        contentEl.style.display = "";
        maskEl.className = "background-mask";
        buttonEl.innerHTML = "Hide everything";
    } else {
        contentEl.style.display = "none";
        maskEl.className = "";
        buttonEl.innerHTML = "Show everything";
    }
};