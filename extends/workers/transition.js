(function () {
	var k = 0, _imageData, pattern, p;
    addEventListener('message', function (event) {
	
		var imageData, finish = true;
		
		if (!_imageData) {
			_imageData = event.data.imgData;
			pattern = event.data.pattern;
		}
		
		
		if (!_imageData) return;
		
		var data = _imageData.data, val;
		
		k += 10;
		
		for (var i=0; i < pattern.length; i++) {
			  // if (Math.floor((Math.random() * 255) + 0) >= k) {
				// data[i+3] -= 30;
			  // }
			  if (pattern[i] <= k) {
				 val = data[i*4+3] - 20;
				 if (val <= 0) {
					val = 0;
				 }
				 else {
					finish = false;
				 }
				 data[i*4+3] = val;
			  }
			  else {
				 finish = false;
			  }
		}
		
		postMessage({
			imageData: _imageData,
			finish: finish
		});	
    });
}());