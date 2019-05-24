var loader = {
    value: 0,
    increment: async (percent) => {
        loader.value += percent;
        loader.bar.style.borderLeft = loader.max * (loader.value / 100) + 'px solid white';
    },
    hide: () => {
        loader.element.style.opacity = 0;
        setTimeout(() => {loader.element.style.display = 'none';}, 350);
    },
    setText: (str) => {
        loader.info.innerText = str;
    }
}

loader.element = document.getElementById('page-loader');
loader.content = document.getElementById('loading-content');
loader.info = document.getElementById('loading-info');
loader.bar = document.getElementById('loading-bar');

loader.max = loader.bar.clientWidth;
loader.content.style.opacity = 1;
