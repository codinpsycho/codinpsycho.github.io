var context = null;
var audio_source = null;
var buffer_length = null;
var time_buffer = null;
var frequency_buffer = null;
var analyser = null;
var canvas = null;
var canvas_colors = null;
var canvas_width = 1300;
var canvas_height = 768;
var colors = ["red", "green", "blue"];

context = create_audio_context();
create_audio_source('microphone', 'zombies');

canvas_colors = get_canvas('canvas_colors');
draw_circles();

//Create AudioContext
function create_audio_context()
{
	var contextClass = (window.AudioContext || 
	  window.webkitAudioContext || 
	  window.mozAudioContext || 
	  window.oAudioContext || 
	  window.msAudioContext);

	if (contextClass)
	{
	  // Web Audio API is available.
	  return new contextClass();
	}
	else
	{
		alert("Webaudio is not supported, use a newer version of browser");
	  // Web Audio API is not available. Ask the user to use a supported browser.
	}	
}

function create_audio_source(type, url_id)
{
	switch(type)
	{
		case 'microphone':
			init_microphone();
		break;

		case 'buffer':
			load_sound(url_id);
		break;

		case 'html':
			var audio = document.getElementById(url_id);
			audio_source = context.createMediaElementSource(audio);			
			audio_source_created();
			audio.play();
		break;

	}
}


function _audio_stream_callback(stream)
{	
	audio_source = context.createMediaStreamSource(stream);
	audio_source_created();	
}

function init_microphone()
{	
	navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

	if (navigator.getUserMedia)
	{
   		navigator.getUserMedia
   		(

	      // constraints
	      {	         
	         audio: true
	      },

	      // successCallback
			_audio_stream_callback,

	      // errorCallback
	      function(err)
	      {
	         console.log("The following error occured: " + err);
	      }
	  	
   		);
   	}
   	else
   	{
   		alert("No usermedia");
   	}
}

function _audio_buffer_callback(audio_data)
{	
	audio_source = context.createBufferSource();
	audio_source.buffer = audio_data;
	audio_source_created();	
}

//Helper Functions
function load_sound(url)
{
	request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	request.onload = function()
	{
		context.decodeAudioData(request.response, _audio_buffer_callback, function(e){"Error with decoding audio data" + e.err});
	};

	request.onerror = function()
	{
		$('#info').text('buffer: XHR error');	
	};
	
	request.send();
}

function get_canvas(canvas_id)
{
	var canvas_html = document.getElementById(canvas_id);
	if(canvas_html)
	{
		canvas_html.width = canvas_width;
		canvas_html.height = canvas_height;

		return canvas_html.getContext("2d");
	}
}

function draw_osc()
{	
	requestAnimationFrame(draw_osc);
	canvas.clearRect(0,0,canvas_width, canvas_height);
	
	if(analyser)
	{
		analyser.getByteTimeDomainData(time_buffer);
		//analyser.getByteFrequencyData(time_buffer);
	}
	//canvas.fillStyle = 'rgb(240,240,240)';
    //canvas.fillRect(0, 0, canvas_width, canvas_height);

    canvas.beginPath();
    var x_slice = canvas_width/buffer_length;
    var x = 0;

    for (var i = 0; i < buffer_length; i++)
    {
    	var v = time_buffer[i] / 128.0;
    	var y = v * canvas_height/2;

    	if(i == 0)
    	{
    		canvas.moveTo(x,y);
    	}
    	else
    	{
			canvas.lineTo(x,y);
    	}
    	
    	x += x_slice;
    };

    canvas.lineTo(canvas.width, canvas.height/2);
    canvas.stroke();
}

//Do your connections here
function audio_source_created()
{
	//Create hi-pass bi-quad filter to filter out treble
	var biquadFilter = context.createBiquadFilter();
	biquadFilter.type = "lowpass";
	biquadFilter.frequency.value = 1000;
	biquadFilter.gain.value = 25;

	//Create analyser
	analyser = context.createAnalyser();	
	analyser.fftSize = 1024;
	buffer_length = analyser.frequencyBinCount;
	time_buffer = new Uint8Array(buffer_length);
	frequency_buffer = new Uint8Array(buffer_length);

	audio_source.connect(biquadFilter);	
	biquadFilter.connect(analyser);
}

function get_average_value(values)
{
	var total = 0;

	for (var i = 0; i < values.length; i++)
	{
		total += values[i];		
	};

	return total/(values.length/2);
}

function draw_bars()
{
	requestAnimationFrame(draw_bars);
	canvas.clearRect(0,0,canvas_width, canvas_height);

	if(analyser)
	{		
		analyser.getByteFrequencyData(frequency_buffer);
		analyser.getByteTimeDomainData(time_buffer);

		var avg_frequency = get_average_value(frequency_buffer);
		var avg_time = get_average_value(time_buffer);

		canvas.font = "20px sans-serif";		
		
		//canvas.fillStyle = '#FFFFFF';
		for (var i = 0; i < buffer_length; i++)
		{
			canvas.fillRect(i, canvas_height - time_buffer[i], 5, canvas_height);
			canvas.fillRect(i*5 , 0 , 5, frequency_buffer[i]);
		}

		canvas.fillStyle = '#CF0000';
		canvas.fillRect(canvas_width-30 , canvas_height-avg_frequency , 30, avg_frequency*3);
		canvas.fillRect(canvas_width-80 , canvas_height-avg_time , 30, avg_time);
	}
}

function draw_colors()
{
	requestAnimationFrame(draw_colors);
	canvas_colors.clearRect(0,0,canvas_width, canvas_height);

	if(analyser)
	{		
		analyser.getByteFrequencyData(frequency_buffer);
		analyser.getByteTimeDomainData(time_buffer);

		var avg_frequency = get_average_value(frequency_buffer);
		console.log(avg_frequency);

		canvas_colors.font = "20px sans-serif";		
		//canvas_colors.fillStyle = 'RGB('+avg_frequency*3+',0,0)';//+time_buffer[i]+')';
		//canvas_colors.fillRect(0 , 0 , canvas_width, canvas_height)
		if(avg_frequency > 60)
			avg_frequency *=3;
		for (var i = 0; i < frequency_buffer.length/10; i++)
		{

			canvas_colors.fillStyle = 'RGB('+avg_frequency+',0,0,'+time_buffer[i]+')';
			//canvas_color.fillRect(i, canvas_height - time_buffer[i], 5, canvas_height);
			//canvas_color.fillRect(i , 0 , 5, frequency_buffer[i]);
			canvas_colors.fillRect(0 , 0 , canvas_width, canvas_height);
		}
	}
}

var color_index = 0;
var avg_frequency = 0;
var last_avg_frequency = 0;
var beat_threshold = 25;
var min_beat_threshold = 5;
function draw_circles()
{
	requestAnimationFrame(draw_circles);
	canvas_colors.clearRect(0,0,canvas_width, canvas_height);

	if(analyser)
	{		
		analyser.getByteFrequencyData(frequency_buffer);
		analyser.getByteTimeDomainData(time_buffer);

		process_beat_detection(frequency_buffer);
		
		var circle_color = 0;
		var bg_color = 0;

		//Determine color
		switch(color_index)
		{
			case 0: 	//Red
				circle_color = 'RGB('+Math.floor(255 - avg_frequency)+',0,0)';
				canvas_color = 'RGB('+Math.floor(avg_frequency)+',0,0)';
				//canvas_color = 'RGB(100,0,0)';
			break;

			case 1:
				circle_color = 'RGB(0,'+Math.floor(255 - avg_frequency)+',0)';
				canvas_color = 'RGB(0,'+Math.floor(avg_frequency)+',0)';
				//canvas_color = 'RGB(0,100,0)';
			break;

			case 2:
				circle_color = 'RGB(0,0,' + Math.floor(255 - avg_frequency) + ')';
				canvas_color = 'RGB(0,0,' + Math.floor(avg_frequency) + ')';
				//canvas_color = 'RGB(0,0,100)';
			break;
		}		

		canvas_colors.fillStyle = canvas_color;
	    canvas_colors.fillRect(0 , 0 , canvas_width, canvas_height);

	    canvas_colors.beginPath();
	    canvas_colors.arc(canvas_width/2, canvas_height/2, (avg_frequency*4) , 0, 2 * Math.PI, false);	    
	    
	    canvas_colors.fillStyle = circle_color;
	    canvas_colors.fill();	    
	    canvas_colors.strokeStyle = canvas_colors.fillStyle;
	    canvas_colors.stroke();	    
	}
}

var beat_decay = 1.5;
var beat_growth = 10;
var beat_hold = 2;
var time_since_last_beat_detect = 0;
function process_beat_detection(frequency_buffer)
{
	console.log(beat_threshold);
	last_avg_frequency = avg_frequency;
	avg_frequency = get_average_value(frequency_buffer);
	if(avg_frequency > last_avg_frequency)
	{
		var beat_diff = avg_frequency - last_avg_frequency;

		if(beat_diff > beat_threshold)
		{
			//Beat detected
			time_since_last_beat_detect = 0;
			beat_threshold += beat_growth;

			//Change color
			color_index++;

			if(color_index == colors.length)
				color_index = 0;
		}
		else
		{
			time_since_last_beat_detect++;			
			if(time_since_last_beat_detect > beat_hold)
			{
				time_since_last_beat_detect = 0;
				beat_threshold -= beat_decay;
				if(beat_threshold < min_beat_threshold)
				{
					beat_threshold = min_beat_threshold;
				}

			}
		}
	}
}

