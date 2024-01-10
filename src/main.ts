import projects from './projects';

// Modify the prototype to close modal when clicked outside
HTMLDialogElement.prototype.triggerShow = HTMLDialogElement.prototype.showModal;

HTMLDialogElement.prototype.showModal = function() {
    this.triggerShow();
    this.onclick = (event: MouseEvent) => {
        let rect = this.getBoundingClientRect();
        if (event.clientY < rect.top || event.clientY > rect.bottom) return this.close();
        if (event.clientX < rect.left || event.clientX > rect.right) return this.close();
    };
};

projects();
