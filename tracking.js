var service;
var map;
var infowindow;
var chart1;
var chart2;
var flightCoordinates = [];
var file;
var file_write_name;
var CoordinateArray = [];
var valtozo;

google.load('visualization', '1', {packages: ['columnchart']});

google.setOnLoadCallback(plotElevation);


//FUNCTION 'INITIALIZE' IS CALLED EVERY TIME THE PAGE IS LOADED. IT CALLS EVERY OTHER FUNCTION
function initialize() 
  {
	
	file = document.getElementById("myFile").files[0].name;
	
	readDataFromTxtFile(file);
	
	var mapOptions = {
	  center: new google.maps.LatLng(CoordinateArray[0].latitude, CoordinateArray[0].longitude),
	  zoom: 15,
	  //type: HYBRID ROADMAP SATELLITE TERRAIN
	  mapTypeId: 'hybrid'
	};
	
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		
	for(var i=0; i<CoordinateArray.length; i = i+100)
	{
		flightCoordinates.push(new google.maps.LatLng(CoordinateArray[i].latitude, CoordinateArray[i].longitude));
	}

	var flightRoute = new google.maps.Polyline({
		path: flightCoordinates,
		geodesic: true,
		strokeColor: '#00FF00',
		strokeOpacity: 1.0,
		strokeWeight: 2
		});
		
	flightRoute.setMap(map);
	
	var positionalRequest = {
		'locations': flightCoordinates
		}
	
	//Create a new ElevationService
	service = new google.maps.ElevationService();
	
	service.getElevationForLocations(positionalRequest, function(results, status) {
		if(status == google.maps.ElevationStatus.OK)
		{
			if(results[0])
			{				
				infowindow = new google.maps.InfoWindow();
				var latlong = new google.maps.LatLng(CoordinateArray[0].latitude, CoordinateArray[0].longitude, true);
			
				infowindow.setContent('Elevation is:' + results[0].elevation + 'meters.');
				infowindow.setPosition(latlong);
				infowindow.open(map);			
			}
			else{
				alert('No results found');
			}
		}
		else
		{
			alert('Elevation service failed due to: ' + status);
		}
	});
	
	google.maps.event.addListener(map, 'click', printElevation);
	
	flightRoute.setMap(map);
	
	drawPath();
	
	var file_name_parts = file.split("_");
	file_write_name = "GPS_CORR_" + file_name_parts[1] + "_" + file_name_parts[2] + ".txt";
	


	
  }
  
  
  //-------------------------------------------------------------------------------------------------------------------------
		  
function printElevation(event) 
  {
	var locations = [];	
	locations.push(event.latLng);
	
	var positionalRequest = {
		'locations': locations
	}
	
	service.getElevationForLocations(positionalRequest, function(results, status){
		if (status == google.maps.ElevationStatus.OK)
		{	
			if(results[0])
			{
				var infowindow_clicked = new google.maps.InfoWindow();
				var latlong = new google.maps.LatLng(47.590225, 19.101005, true);
			
				infowindow.setContent('Elevation is: ' + results[0].elevation + 'meters.');
				infowindow.setPosition(event.latLng);
				infowindow.open(map);		
			}
			else
			{
				alert('No results found');
			}
		}
		else
		{			
			alert('Elevation service failed due to: ' + status);				
		}
	});
	
  }

  function drawPath()
  {
	chart1 = new google.visualization.ColumnChart(document.getElementById('measuredAltitude_chart'));
	chart2 = new google.visualization.ColumnChart(document.getElementById('googleMapsElevation_chart'));
	chart3 = new google.visualization.ColumnChart(document.getElementById('altitudeFromGround_chart'));
	chart4 = new google.visualization.ColumnChart(document.getElementById('satellitesInView_chart'));
	var pathRequest = {
		'path': flightCoordinates,
		'samples': 100
	}

	service.getElevationAlongPath(pathRequest, plotElevation);
  }
  
  
  function plotElevation(results, status)
  {
	if (status != google.maps.ElevationStatus.OK) 
	{return;}
	
	var scale = CoordinateArray.length / results.length;
	var iterator = 0;
	
	//Setting and plotting measured altitude chart
	var data1 = new google.visualization.DataTable();
	data1.addColumn('string', 'Sample');
	data1.addColumn('number', 'Elevation');
	for (var i=0; i< CoordinateArray.length; i++)
	{
		if( i%10 == 0)
		{
			data1.addRow(['', CoordinateArray[i].measured_altitude]);
		}
	}	
	var options1 = {
		title: "Altitude measured by GPS",
		titleTextStyle: {fontName: "Times-Roman", fontSize: 40},
		legend: "none",
		titleY: "Altitude (m)"
	};	
	chart1.draw(data1, options1);
	


	//Setting and plotting google maps elevation chart
	var data2 = new google.visualization.DataTable();
	data2.addColumn('string', 'Sample');
	data2.addColumn('number', 'Elevation');
	for (var i=0; i< results.length; i++)
	{
		data2.addRow(['', results[i].elevation]);
	}	
	var options2 = {
		title: "Elevation sampled on route",
		titleTextStyle: {fontName: "Times-Roman", fontSize: 40},
		legend: "none",
		titleY: "Elevation (m)"
	};	
	chart2.draw(data2, options2);
	
	//Setting and plotting altitude from ground chart
	var data3 = new google.visualization.DataTable();
	data3.addColumn('string', 'Sample');
	data3.addColumn('number', 'Elevation');
	for(var i=0; i<CoordinateArray.length; i++)
	{
		iterator = parseInt(i / scale);
		CoordinateArray[i].altitude_from_ground = CoordinateArray[i].measured_altitude - results[iterator].elevation;
		if( i%10 == 0)
		{
			data3.addRow(['', CoordinateArray[i].altitude_from_ground]);
		}
	}
	
	var options3 = {
		title: "Elevation over ground sampled on route",
		titleTextStyle: {fontName: "Times-Roman", fontSize: 40},
		legend: "none",
		titleY: "Elevation (m)"
	};	
	chart3.draw(data3, options3);
	
	//Plotting satellites in view
	var data4 = new google.visualization.DataTable();
	data4.addColumn('string', 'Sample');
	data4.addColumn('number', 'Satellites');
	for(var i=0; i<CoordinateArray.length; i++)
	{
		if( i%10 == 0)
		{
			data4.addRow(['', CoordinateArray[i].satellites_in_view]);
		}
	}
	var options4 = {
		title: "Satellites in view. Positive are differentially corrected, negatives are autonomous",
		titleTextStyle: {fontName: "Times-Roman", fontSize: 40},
		legend: "none",
		titleY: "Number of satellites"
	};	
	chart4.draw(data4, options4);
	
	writeDataToTxtFile(file_write_name);

  }
  
  function readDataFromTxtFile(file)
  {
	
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function ()
	{
		if(rawFile.readyState === 4)
		{
			if(rawFile.status === 200 || rawFile.status === 0)
			{
				var allText = rawFile.responseText;
				var lines = allText.split("\n");
				
				var iterator = 0;
				
				for (var i=0; i<lines.length; i++)
				{
					var line = lines[i];
					var lineData = line.split(",");
				
				
					if( lineData[0] === "$GPRMC")
					{		
						var time;
						var date;
						
						var latitude = 0;
						var longitude = 0;	
						
						time = lineData[1];
						date = lineData[9];
						
						var latitudeDM = parseFloat(lineData[3]);	
						var latitudeInt = parseInt(latitudeDM);

						var latitudeD = parseInt( latitudeInt / 100 );
						var latitudeM = latitudeDM - latitudeD*100;
						
						latitude = latitudeD + (latitudeM / 60);
						
						if(lineData[4] === "S")
						{
							latitude = latitude * (-1);
						}
						
						var longitudeDM = parseFloat(lineData[5]);
						var longitudeInt = parseInt(longitudeDM);

						var longitudeD = parseInt( longitudeInt / 100 );
						var longitudeM = longitudeDM - longitudeD*100;
						
						longitude = longitudeD + (longitudeM / 60);						
						
						if(lineData[6] === "W")
						{
							longitude = longitude * (-1);
						}
						
						var text = '{"time":' + time +', "date":' + date +', "latitude":' + latitude + ', "longitude":' + longitude + ', "measured_altitude":' + 0.0 + ', "satellites_in_view":' + 0 +  ', "altitude_from_ground":' + 0.0 + '}';
						
						var newCoordinate = JSON.parse(text);
						
						CoordinateArray.push(newCoordinate);

					}
					if( lineData[0] === "$GPGGA")
					{	
						var altitude = parseFloat(lineData[9]);
						var satellites = parseInt(lineData[7]);
						
						if( parseInt(lineData[6]) == 1 )
						{
							satellites *= -1;
						}
						
						CoordinateArray[iterator].measured_altitude = altitude;
						CoordinateArray[iterator].satellites_in_view = satellites;
						
						iterator++;
					}
					

					
					
				}	
			}
		}
	}
	
	
	rawFile.send(null);
  }
  
  function writeDataToTxtFile(file)
  {
	
	var url = "get_data.php"
	
	var http = new XMLHttpRequest();
		
	for(var i=0; i < CoordinateArray.length ; i++)
	{
		var http = new XMLHttpRequest();
		http.open("POST", url, false);

		data = "date=" + String(CoordinateArray[i].date) + "&time=" + String(CoordinateArray[i].time*100) + "&altitude=" + String(CoordinateArray[i].altitude_from_ground) + "";
		
		http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		//http.setRequestHeader("Content-length", data.length);
		//http.setRequestHeader("Connection", "close");
		
		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200)
			{
			}
		}
		
		http.send(data);
	
	}


	
}
  
  google.maps.event.addDomListener(window, 'resize', drawPath );
