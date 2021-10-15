function setupListeners() {
    let menuButtons = document.getElementsByClassName('menu-item');

    for (let i = 0; i < menuButtons.length; i++) {
        menuButtons[i].addEventListener('click', function() {
            switch (this.id) {
                case 'game-controls':
                    setSecondaryMenuTitle('Controls');
                    showSecondaryMenuContent('controls');
                    break;
                case 'game-credits':
                    setSecondaryMenuTitle('Credits');
                    showSecondaryMenuContent('credits');
                    break;
                default:
                    return;
            }

            showSecondaryMenu();
        });
    }
}

function showSecondaryMenu() {
    document.getElementById('secondary-menu').className = 'bordered-box';
}

function hideSecondaryMenu() {
    document.getElementById('secondary-menu').className = 'bordered-box hidden';
    hideSecondaryMenuContent('controls');
    hideSecondaryMenuContent('credits');
}

function setSecondaryMenuTitle(title) {
    document.getElementById('secondary-menu-title').textContent = title;
}

function setSecondaryMenuContentClass(contentName, className) {
    document.getElementById('secondary-menu-' + contentName + '-content').className = className;
}

function showSecondaryMenuContent(contentName) {
    setSecondaryMenuContentClass(contentName, '');
}

function hideSecondaryMenuContent(contentName) {
    setSecondaryMenuContentClass(contentName, 'hidden');
}