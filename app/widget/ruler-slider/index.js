/* ==================================================================== *
* Widget automatically generated on 2025-10-29T06:58:33.201Z
* npm run add-widget -- --fig=<grpup.family> --dest=/path/to/the/widget
* ==================================================================== */

class ruler_slider extends LetcBox {


  /**
   * 
   */
  initialize(opt = {}) {
    require('./skin');
    super.initialize(opt);
    this.declareHandlers();
    this.model.atLeast({ value: 1 })
  }


  /**
   * 
   */
  commitChange(cmd) {
    let value = cmd.mget('mark')
    this.mset({ value })
    this.triggerHandlers({ importance: value })
  }

  /**
   * 
   * @param {*} draggable 
   * @param {*} container 
   */
  setupInteract(draggable, container) {

    draggable.draggable = true;
    draggable.addEventListener('dragstart', (e) => {
      e.target.style.opacity = '0';
      this._startedX = e.x;
      this._startedTop = e.target.style.top;
      draggable.dataset.drag = "1";
      this._startedWidth = draggable.innerWidth();
    });
    draggable.addEventListener('drag', (e) => {
      let delta = e.x - this._startedX;
      let w = delta + this._startedWidth;
      draggable.style.width = `${delta + this._startedWidth}px`
      e.target.style.top = '0';
    });

    draggable.addEventListener('dragend', (e) => {
      let delta = e.x - this._startedX;
      let w = delta + this._startedWidth;
      let min = 1000;
      let nearest;
      draggable.dataset.drag = "0";
      for (let c of container.children.toArray()) {
        if (c.getIndex() === 0) continue;
        delta = Math.abs(c.$el.position().left - w)
        if (delta < min) {
          min = delta
          nearest = c;
        }
      }
      if (!nearest) return
      let { left } = nearest.$el.position()
      draggable.style.width = `${left + 30}px`
      e.target.style.opacity = '1';
      this.commitChange(nearest)
    });
  }

  /**
   * 
   */
  getData() {
    let r = {
      name: this.mget(_a.name),
      value: this.mget(_a.value),
    }
    r[this.mget(_a.name)] = this.mget(_a.value)
    return r
  }

  /**
   * 
   * @param {*} child 
   * @param {*} pn 
   * @param {*} section 
   */
  onPartReady(child, pn, section) {
    switch (pn) {
      case _a.slider:
        this.ensurePart("rulers").then(async (p) => {
          this.setupInteract(child.el, p)
          let mark = this.mget(_a.value);
          if (mark && mark > 1) {
            p.children.forEach((c) => {
              if (c.mget('mark') == mark) {
                let { left } = c.$el.position()
                this.ensurePart(_a.slider).then((p) => {
                  p.el.style.width = `${left + 30}px`
                })
              }
            })
          }
        })
        break;
    }
  }

  /**
   * Upon DOM refresh, after element actually insterted into DOM
   */
  onDomRefresh() {
    this.feed(require('./skeleton')(this));

  }

  /**
   * User Interaction Evant Handler
   * @param {View} trigger
   * @param {Object} args
   */
  onUiEvent(trigger, args = {}) {
    const service = args.service || trigger.get(_a.service);
    this.debug(`onUiEvent service : `, { service, args, trigger })
    switch (service) {
      case _e.select:
        this.commitChange(trigger);
        let { left } = trigger.$el.position()
        this.ensurePart(_a.slider).then((p) => {
          p.el.style.width = `${left + 30}px`
        })
        break;
    }
  }


}

module.exports = ruler_slider