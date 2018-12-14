/*
  text2pic, 2018
  Author: Alex Buznik <shu@buznik.net>
*/
(function() {
  var App = function() {
    var that = this;
    var localStorageKey = 'text2pic';
    var data = {
      text: '',
      textColor: '#41ABD5',
      bgColor: '#fff'
    }
    retrieveData();
    this.$el = $('.text2pic');

    this.$file = this.$el.find('.upload input');
    var CANVAS_WIDTH = 1000;
    var debounceTimer;
    var canvas = this.$el.find('#preview')[0];
    var textarea = this.$el.find('textarea');
    textarea.val(data.text);
    updateTextAreaStyles();
    
    var context = canvas.getContext("2d"); 
    var img = new Image();
    var imageDimensions = {
      width: 0,
      height: 0
    };
    
    var padding = 20;
    var fontSize = 40;
    var lineHeight = fontSize*1.3;
    var downloadLink = $('.save a')[0];
  
    onDynamicText();

    var hueBeeOptions = {
      setText: false,
      setBGColor: true,
      saturations: 2
    };
    var huebBg = new Huebee( $('.colorpicker .bgColor')[0], hueBeeOptions);
    huebBg.setColor(data.bgColor);
    huebBg.on('change', color => {
      data.bgColor = color;
      updateTextAreaStyles();
      storeData();
      reDraw();
    });
    var huebText = new Huebee( $('.colorpicker .textColor')[0], hueBeeOptions);
    huebText.setColor(data.textColor);
    huebText.on('change', color => {
      data.textColor = color;
      updateTextAreaStyles();
      storeData();
      reDraw();
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
            img.src = loadEvent.target.result;
            img.onload = onImageLoad;
          }
        }
      } else {
        console.error("not an image");
        this.$el.find('.upload .error').text('Это не картинка');
      }
    });

    function debounce(callback, wait) {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(function() {
        clearTimeout(debounceTimer);
        callback()
      }, wait);
    }
    
    function onImageLoad() {
      imageDimensions = getImageDimensions(img);
      canvas.width = imageDimensions.width + padding*2;
      canvas.height = imageDimensions.height + lineHeight*4 + padding*2;
      drawImage();
      drawText(data.text);
      window.scrollTo(0, textarea.offset().top);
      textarea.focus();
    }
    
    function getImageDimensions(img) {
      return {
        width: CANVAS_WIDTH,
        height: (CANVAS_WIDTH * img.height) / img.width
      }
    }

    function updateTextAreaStyles() {
      textarea.css({
        color: data.textColor,
        background: data.bgColor
      })
    }

    function reDraw() {
      drawImage();
      drawText(data.text);
    }
    
    function drawImage() {
      context.fillStyle = data.bgColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, padding, padding, imageDimensions.width, imageDimensions.height);
    }
    
    function drawText(theText) {
      context.fillStyle = data.textColor;
      context.textBaseline = 'middle';
      context.font = fontSize + "px 'Helvetica'";
      
      wrapText(
        context,
        theText,
        padding,
        imageDimensions.height + padding*3,
        canvas.width - padding*2,
        lineHeight);
      
      var timeStr = (Date.now() + '');
      var lastDigitsTime = timeStr.slice(timeStr.length-6);
      downloadLink.download = `text2pic-${lastDigitsTime}.jpg`;
      downloadLink.href = canvas.toDataURL('image/jpeg', .85);
    }
    function onDynamicText() {
      textarea.on('keyup', function(event) {
        data.text = $(this).val();
        debounce(function() {
          drawImage();
          drawText(data.text);
          storeData();
        }, 100);
      });
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
        var result = localStorage.setItem(localStorageKey, JSON.stringify(data));
      } catch(err) {
        console.error('Error storing localStorage', err);
      }
    }
    function retrieveData() {
      try {
        var fromLocalStorage = localStorage.getItem(localStorageKey);
        if (fromLocalStorage) {
          data = JSON.parse(fromLocalStorage);
          console.log('retrieveData', data);
        }
      } catch(err) {
        console.error('Error retrieving localStorage', err);
      }
    }
    
    console.log('App ready');
  }

  var appInstance = new App();

})();
