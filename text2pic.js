/*
  text2pic, 2018
  Author: Alex Buznik <shu@buznik.net>
  Repo URL: https://github.com/beshur/text2pic
*/
(function() {
  var App = function() {
    var that = this;
    var CANVAS_WIDTH = 1000;
    var LOCALSTORAGE_KEY = 'text2pic';
    var imageModel = new ImageModel(CANVAS_WIDTH, onImageLoad);

    var data = {
      text: '',
      textColor: '#41ABD5',
      bgColor: '#fff'
    }
    retrieveData();
    this.$el = $('.text2pic');
    this.$file = this.$el.find('.upload input');

    var debounceTimer;
    var canvas = this.$el.find('#preview')[0];
    var textarea = this.$el.find('textarea');
    textarea.val(data.text);

    updateTextAreaStyles();
    
    this.$el.find('.rotate').on('click', (event) => {
      imageModel.rotate(90);
      reDraw();
    });

    // clicking on canvas should also double as image input
    $(canvas).on('click', event => {
      this.$el.find('.upload .button').click();
    });

    this.$file.on('change', (event) => {
      console.log('file input', event.target.files);
      var files = event.target.files; // FileList object
      var file = files[0];
      if(file.type.match('image.*')) {
        this.$el.find('.upload .error').text('');
        var reader = new FileReader();
        // Read in the image file as a data URL.
        reader.readAsDataURL(file);
        reader.onload = function(loadEvent){
          if( loadEvent.target.readyState == FileReader.DONE) {
            console.log('loadEvent', loadEvent.target.result.length);
            imageModel.setNewPic(loadEvent.target.result)
          }
        }
      } else {
        console.error("not an image");
        this.$el.find('.upload .error').text('Это не картинка');
      }
    });

    textarea.on('keyup', function(event) {
      data.text = $(this).val();
      debounce(function() {
        drawImage();
        drawText(data.text);
        storeData();
      }, 100);
    });

    var hueBeeOptions = {
      setText: false,
      setBGColor: true,
      saturations: 2
    };
    var huebBg = new Huebee( $('.colorpicker .bgColor')[0], hueBeeOptions);
    var heubCommonChange = () => {
      updateTextAreaStyles();
      storeData();
      reDraw();
    }
    huebBg.setColor(data.bgColor);
    huebBg.on('change', color => {
      data.bgColor = color;
      heubCommonChange()
    });
    var huebText = new Huebee( $('.colorpicker .textColor')[0], hueBeeOptions);
    huebText.setColor(data.textColor);
    huebText.on('change', color => {
      data.textColor = color;
      heubCommonChange();
    });

    var context = canvas.getContext("2d"); 
    
    var padding = 20;
    var fontSize = 40;
    var lineHeight = fontSize*1.3;
    var downloadLink = $('.save a')[0];

    function debounce(callback, wait) {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(function() {
        clearTimeout(debounceTimer);
        callback()
      }, wait);
    }
    
    function onImageLoad(image) {
      that.$el.find('.preview').show();
      reDraw();
      window.scrollTo(0, textarea.offset().top);
      textarea.focus();
    }
    
    function updateTextAreaStyles() {
      textarea.css({
        color: data.textColor,
        background: data.bgColor
      })
    }

    function reDraw() {
      resizeCanvas();
      drawImage();
      drawText(data.text);
    }

    function resizeCanvas()  {
      var imgSize = imageModel.getSize();
      canvas.width = CANVAS_WIDTH + padding*2;
      canvas.height = imgSize.height + lineHeight*4 + padding*2;
    }
    
    function drawImage() {
      var imgSize = imageModel.getSize();
      var rotation = imageModel.getRotation();
      var args = [
        imageModel.getPicData(),
        padding,
        padding,
        imgSize.width,
        imgSize.height
      ];

      context.fillStyle = data.bgColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.save();
      
      _rotateCanvas(rotation);

      switch(rotation) {
        case 0:
          console.log('drawImage, rotation: %s ', rotation);
          break;
        case 90:
          console.log('drawImage, rotation: %s ', rotation);

          context.translate(0, -imgSize.width);

          // x is y
          args[1] = padding;
          // y is x
          args[2] = -padding;
          // w is new height
          args[3] = imgSize.height;
          // h is new width
          args[4] = imgSize.width;

          break;
        case 180:
          console.log('drawImage, rotation: %s ', rotation);
          context.translate(-imgSize.width, -imgSize.height);
          // x is y
          args[1] = -padding;
          // y is x
          args[2] = -padding;

          break;
        case 270:
          console.log('drawImage, rotation: %s ', rotation);
          context.translate(-imgSize.height, 0);
          // x is y
          args[1] = -padding;
          // y is x
          args[2] = padding;
          // w is new height
          args[3] = imgSize.height;
          // h is new width
          args[4] = imgSize.width;
          break;
        default:
          console.log('drawImage, rotation: default ');
          break;
      }
      context.drawImage(...args);
      context.restore();
    }

    function _rotateCanvas(degrees) {
      context.rotate(Math.PI / 180 * degrees);
    }
    
    function drawText(theText) {
      var imgSize = imageModel.getSize();
      context.fillStyle = data.textColor;
      context.textBaseline = 'middle';
      context.font = fontSize + "px 'Helvetica'";
      
      wrapText(
        context,
        theText,
        padding,
        imgSize.height + padding*3,
        canvas.width - padding*2,
        lineHeight);
      
      var timeStr = (Date.now() + '');
      var lastDigitsTime = timeStr.slice(timeStr.length-6);
      downloadLink.download = `text2pic-${lastDigitsTime}.jpg`;
      downloadLink.href = canvas.toDataURL('image/jpeg', .85);
    }
    
    function wrapText(context, text, x, y, maxWidth, lineHeight) {
      var words = text.split(' ');
      var line = '';
    
      text.split('\n').forEach(line => {
        context.fillText(line, x, y);
        y += lineHeight;
      });
    }

    function storeData() {
      try {
        var result = localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
      } catch(err) {
        console.error('Error storing localStorage', err);
      }
    }
    function retrieveData() {
      try {
        var fromLocalStorage = localStorage.getItem(LOCALSTORAGE_KEY);
        if (fromLocalStorage) {
          data = JSON.parse(fromLocalStorage);
          console.log('retrieveData', data);
        }
      } catch(err) {
        console.error('Error retrieving localStorage', err);
      }
    }
    console.info('App ready');
  }

  var ImageModel = function(canvasWidth, onloadCb) {
    var defaults = {
      picData: null,
      rotation: 0,
      width: 0,
      height: 0
    }

    this.canvasWidth = canvasWidth;
    this.onload = onloadCb;

    this._init = () => {
      this.reset();
      console.log('ImageModel init');
    }

    this._getDefaults = () => {
      var img = new Image();
      img.onload = () => {
        this._calcSize();
        this.onload();
      }
      return Object.assign({}, defaults, {
        picData: img
      });      
    }

    this.reset = () => {
      this.data = this._getDefaults();
    }


    this._setPicData = (picData) => {
      this.data.picData.src = picData;
    }

    this.setNewPic = (picData) => {
      this.reset();
      console.warn('setNewPic ', this.data);
      this._setPicData(picData);
    }

    this.rotate = (degrees) => {
      this.data.rotation = this.data.rotation + degrees;
      if (this.data.rotation >= 360) {
        this.data.rotation = 0;
      }
      this._calcSize();
    }

    this._scaleProportionally = (width, height) => {
      return (this.canvasWidth * height) / width;
    }

    this._calcSize = () => {
      var imgWidth = this.data.picData.width;
      var imgHeight = this.data.picData.height;

      var result = {
        width: this.canvasWidth,
        height: this._scaleProportionally(imgWidth, imgHeight)
      };

      if (90 === this.data.rotation || 270 === this.data.rotation) {
        result.width = this.canvasWidth;
        // swapped width with height
        result.height = this._scaleProportionally(imgHeight, imgWidth);
      }

      this.data.width = result.width;
      this.data.height = result.height;

      return result;
    }

    this.getSize = () => {
      return {
        width: this.data.width,
        height: this.data.height
      }
    }

    this.getRotation = () => this.data.rotation;
    this.getPicData = () => this.data.picData;

    this.destroy = () => {
      this.data.picData = null;
      this.data = null;
    }


    this._init();

    return this;
  }

  var appInstance = new App();

})();
