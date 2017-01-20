function updateMask() {
    const backgroundMask = document.getElementById("backgroundMask");
    const time = new Date().getHours();
    const opacity = Math.abs(12 - time) * 0.07;
    backgroundMask.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    console.log(`New opacity: ${opacity}`);
};

window.onload = () => {
    const month = new Date().getMonth();
    const canvas = document.getElementById("particle-canvas");
    if (month >= 11 || month <= 2) {
        new Particles(Particles.configs().snow, canvas).start();
    } else {
        new Particles(Particles.configs().lattice, canvas).start();
    }
    updateMask();
    setInterval(updateMask, 10000);
};
