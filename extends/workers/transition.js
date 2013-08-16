(function () {
 
    var k=0;
    addEventListener('message', function (event) {
		var data = event.data;
        k += 3;
		for (var i=0; i < data.length; i+=4) {
			data[i] += k;
			data[i+1] += k;
			data[i+2] += k;
			data[i+3] -= k;
		  }
		postMessage(data);
    });
    
    
}());