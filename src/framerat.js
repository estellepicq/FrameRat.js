/**
* @namespace
*/
var FRAMERAT = {

  /**
  * @author Ludovic Cluber <http://www.lcluber.com>
  * @file Animation frame library.
  * @version 0.2.4
  * @copyright (c) 2011 Ludovic Cluber

  * @license
  * MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in all
  * copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  * SOFTWARE.
  *
  */
  revision: '0.2.4',

  id: null, //animation frame ID
  onAnimate: function(){}, //call this functiion at each frame

  tickCount : 0,
  fsm       : {},
  clock     : {},
  frameId   : 0,
  options   : {
    refreshRate : 30
  },
  console : {},
  formated : {
    delta : 0
  },

  /**
  * Create a new animation frame.
  * @since 0.2.0
  * @method
  * @param {function} onAnimate The name of your onAnimate callback function.
  * @param {string} scope the scope to pass to the onAnimate callback .
  * @returns {animationFrame}  The new animation frame
  */
  create : function( onAnimate, scope ) {
    var _this = Object.create(this);
    _this.createOnAnimateCallback( onAnimate, scope );
    _this.createFiniteStateMachine();
    _this.createConsole();
    _this.clock = FRAMERAT.Clock.create();
    return _this;
  },

  createOnAnimateCallback : function( onAnimate, scope ){
    if (!scope)
      this.onAnimate = onAnimate;
    else
      this.onAnimate = onAnimate.bind(scope);
    
  },

  createConsole : function(){
    this.console = FRAMERAT.Console.create( TYPE6.Vector2D.create(), TYPE6.Vector2D.create(20,20) );
    this.console.addLine('Elapsed time : {0}', this.getFormatedTotalTime, this );
    this.console.addLine('Frame count : {0}', this.getFrameNumber, this );
    this.console.addLine('Frame Per Second : {0}', this.getFramePerSecond, this );
    this.console.addLine('Frame duration : {0}', this.getFormatedDelta, this );
    this.toggleConsole(); //display the console by default
  },

  createFiniteStateMachine : function(){
    this.fsm = TAIPAN.create([
                //{ name: 'start',    from: 'idle',    to: 'running' },
                { name: 'play',  from: 'paused',  to: 'running' },
                { name: 'pause', from: 'running', to: 'paused' },
                //{ name: 'stop',     from: 'paused',  to: 'idle' },
              ]);
  },

  // start:function(){
  //     if( this.fsm.start() ){
  //       this.reset();
  //       this.play();
  //     }
  //     return this.fsm.getStatus();
  // },

  /**
  * Start the animation.
  * @since 0.2.0
  * @method
  * @returns {boolean} true if previous state was "paused" false otherwise
  */
  play:function(){
    if( this.fsm.play() ){
      this.clock.start();
      this.requestNewFrame();
      return true;
    }
    return false;
    //return this.fsm.getStatus();
  },

  /**
  * Pause the animation.
  * @since 0.2.0
  * @method
  * @returns {boolean} true if previous state was "running" false otherwise
  */
  pause:function(){
    if ( this.fsm.pause() ){
      this.cancelAnimation();
      return true;
    }
    return false;
    //return this.fsm.getStatus();
  },
  
  /**
  * Toggle the animation between running and paused states.
  * @since 0.2.0
  * @method
  * @returns {string}  The status of the finite state machine
  */
  toggle:function(){
    if( !this.play() )
      this.pause();
    return this.fsm.getStatus();
  },

  /**
  * Stop and reset the animation.
  * @since 0.2.0
  * @method
  * @returns {boolean} true if previous state was "running" false otherwise
  */
  stop:function(){
    if( this.pause() ){
      this.clock.init();
      this.tickCount = 0;
      return true;
    }
    return false;
    //return this.fsm.getStatus();
  },

  /**
  * Get the total elapsed time since start in seconds.
  * @since 0.1.0
  * @method
  * @param {integer} decimals The number of decimals.
  * @returns {integer}  the elapsed time in seconds
  */
  getTotalTime : function(){
    return this.clock.getTotal();
  },
  
  getFormatedTotalTime : function(){
    return TYPE6.MathUtils.round( this.millisecondToSecond( this.getTotalTime() ), 2 );
  },

  /**
  * Get the elapsed time between the last two frames in second.
  * @since 0.2.0
  * @method
  * @returns {float}  a float number representing the delta in seconds
  */
  getDelta : function(){
    return this.millisecondToSecond( this.clock.getDelta() );
  },
  
  getFormatedDelta : function(){
    if( this.tickCount % this.options.refreshRate === 0 )
      this.formated.delta = TYPE6.MathUtils.round( this.getDelta(), 5 );
  
    return this.formated.delta;
  },

  /**
  * Get the total number of frames since start.
  * @since 0.1.0
  * @method
  * @returns {integer}  the number of frames
  */
  getFrameNumber:function(){
    return this.tickCount;
  },

  /**
  * Get the number of frame per second. this method lets you set a refresh rate in frame.
  * @since 0.1.0
  * @method
  * @param {integer} refreshRate the refresh rate in frames
  * @param {integer} decimals The number of decimals.
  * @returns {array}  the number of frame per second
  */
  getFramePerSecond: function(){
    if( this.tickCount % this.options.refreshRate === 0 )
      this.clock.computeFramePerSecond();

    return this.clock.getFramePerSecond();
  },

  /**
  * Use it at the end of your render method to request a new frame and continue the animation.
  * @since 0.1.0
  * @method
  * @param {string} property The name of a type of assets given in the assets file.
  * @returns {array}  the list of assets as an array or false if property not found
  */
  newFrame:function(){
    this.requestNewFrame();
    this.clock.tick();
  },

  requestNewFrame:function(){
    this.frameId = window.requestAnimationFrame(this.onAnimate);
    this.tickCount++;
  },

  cancelAnimation:function(){
    window.cancelAnimationFrame(this.frameId);
  },
  
  //utils
  millisecondToSecond : function( millisecond ){
    return millisecond * 0.001;
  },
  
  /**
  * Draw the console on the canvas
  * @since 0.2.3
  * @method
  * @param {object} context The context of the canvas.
  */
  drawConsole : function( context ){
    this.console.draw( context );
  },
  
  /**
  * Toggle the console on the canvas to show or hide it
  * @since 0.2.3
  * @method
  */
  toggleConsole : function(){
    this.console.toggle();
  }

};
