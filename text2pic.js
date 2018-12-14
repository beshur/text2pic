/*
  text2pic, 2018
  Author: Alex Buznik <shu@buznik.net>
*/
(function() {
  var App = function() {
    var that = this;
    this.$el = $('.text2pic');

    this.$file = this.$el.find('.upload input');
    var CANVAS_WIDTH = 1000;
    var debounceTimer;
    var canvas = this.$el.find('#preview')[0];
    var textarea = this.$el.find('textarea');
    
    var context = canvas.getContext("2d"); 
    var img = new Image();
    var imageDimensions = {
      width: 0,
      height: 0
    };
    
    var text = '';
    var padding = 20;
    var fontSize = 40;
    var lineHeight = fontSize*1.3;
    
    var downloadLink = $('.save a')[0];
  
    onDynamicText();

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
      drawText(text);
    }
    
    function getImageDimensions(img) {
      return {
        width: CANVAS_WIDTH,
        height: (CANVAS_WIDTH * img.height) / img.width
      }
    }
    
    function drawImage() {
      context.fillStyle = 'rgb(255, 255, 255)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, padding, padding, imageDimensions.width, imageDimensions.height);
    }
    
    function drawText(theText) {
      context.fillStyle = '#333';
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
        text = $(this).val();
        debounce(function() {
          drawImage();
          drawText(text); 
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
    
    console.log('App ready');
  }

  var appInstance = new App();

})();
