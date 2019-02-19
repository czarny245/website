// Initialize map global variable
var map;

// variables containing forsquare api details
var CLIENT_ID = "WYJ23K5PKH2RCV1UCESCNSPPO3UAQJHSWHORAP2AAYTEQAJA";
var CLIENT_SECRET = "YNMGAPQW4ZADXENOYO5T2XLZDFKJYLTHTUOEU102BO13ZDLJ";

// Initialize the map and the ViewModel
function initMap() {
    mapElement = $("#map")
    map = new google.maps.Map(mapElement[0], {
        center: {lat: 51.516569, lng: -0.023806},
        zoom: 14,
    });
    ko.applyBindings(new ViewModel());
}

// Error handling for google maps api
function mapError() {
    $('#map').html('There was an error while loading Google Maps. Please try again.');
}
// Place object constructor
var Place = function(data) {
    this.name = data.name;
    this.lat = data.lat;
    this.lng = data.lng;
    this.id = data.id;
    this.visible = ko.observable(true);
    this.address = '';
    this.postalCode = '';
    this.contact = '';
    this.image = '';
    this.url = '';
}
// ***************************************************
// ViewModel
// ***************************************************
var ViewModel = function() {
    var self = this;

    // Initialize the array that will hold all our Place objects
    this.placesList = ko.observableArray([]);

    // Push all our Place object into the array
    places.forEach(function(placeItem){
        self.placesList.push(new Place(placeItem));
    });

    // Initialize the infowindow
    var infoWindow = new google.maps.InfoWindow({
    });
    
    // This function will fill the Place objects with data from forsquare
    // and create markers and infowindows
    self.placesList().forEach(function(placeItem) {
            // Initialize a marker for every Place object
            var marker = new google.maps.Marker({
                map: map,
                title: placeItem.name,
                position: new google.maps.LatLng(placeItem.lat, placeItem.lng),
                id: placeItem.id,
                animation: google.maps.Animation.DROP
            });

            // ajax call to Forsquare API
            var url = 'https://api.foursquare.com/v2/venues/'+placeItem.id+'?client_id='+CLIENT_ID+'&client_secret='+CLIENT_SECRET+'&v=20180323'
            $.ajax({
                url: url,
                dataType: "json",
                success: function(data) {
                    console.log(data);
                    var address, postalCode, prefix, suffix, contact, url

                    // Not every venue is fully documented in Forsquare.
                    // Check with "if" statements for every piece of data to prevent errors
                    if (data.response.venue.location.address) {
                        address = data.response.venue.location.address;
                    };
                    if (data.response.venue.location.postalCode) {
                        postalCode = data.response.venue.location.postalCode;
                    };
                    if (data.response.venue.bestPhoto) {
                        prefix = data.response.venue.bestPhoto.prefix;
                        suffix = data.response.venue.bestPhoto.suffix;
                    };
                    if (data.response.venue.contact.phone) {
                        contact = data.response.venue.contact.phone;
                    };
                    if (data.response.venue.canonicalUrl) {
                        url = data.response.venue.canonicalUrl;
                    };

                    // Fill Place object with Forsquare data
                    placeItem.address = address;
                    placeItem.postalCode = postalCode;
                    placeItem.image = prefix + "300x300" + suffix;
                    placeItem.contact = contact;
                    placeItem.url = url;
                
                    // Fill infowindows with data. Check if observables are not empty.
                    var infoStr = '<h3>'+placeItem.name+'</h3>';
                    if (placeItem.address) {
                        infoStr +=  '<p>'+placeItem.address+'</p>'
                    }
                    if (placeItem.postalCode) {
                        infoStr += '<p>'+placeItem.postalCode+'</p>'
                    }
                    if (placeItem.contact) {
                        infoStr += '<p>'+placeItem.contact+'</p>'
                    }
                    if (placeItem.image.indexOf("undef") > -1) {
                        infoStr += '<p>'+"There was no photo for this place in Forsquare database"+'</p>'
                    } else {
                        infoStr += '<img src="'+placeItem.image+'" alt="No image in forsquare database">'
                    }
                    if (placeItem.url) {
                        infoStr += '<br><a href="'+placeItem.url+'">Forsquare page</a>'
                    }
                    
                    // Add an "click" eventlistener to markers.
                    marker.addListener("click", function() {
                        self.toggleBounce(placeItem);
                        infoWindow.open(map, marker);
                        infoWindow.setContent(infoStr);
                    });

                    placeItem.info = infoStr;
                    placeItem.marker = marker;
                },
                // This function will inform the user 
                error: function () {
                    marker.addListener('click', function(){
                        infoWindow.open(map, marker);
                        infoWindow.setContent('<h5>The Forsquare request failed.<br> This might be due to exceeding request limits. <br>Pleace try again later.</h5>');
                    })
                    
                } 
               
            });
            // end of ajax call
    
    // This function will toggle bouncing and infowindows when you click on an
    // item from the list
    self.listDetails = function(placeItem) {
        self.toggleBounce(placeItem);
        infoWindow.open(map, placeItem.marker);
        infoWindow.setContent(placeItem.info);
    }

    });
    // Variable that holds the current query from the search bar
    self.query = ko.observable('');

    // This funcion will filter the list of places and their markers on the map
    self.filter = function() {
        console.log("function active "+ self.query());
        self.placesList().forEach(function (placeItem) {
            placeItem.visible(false);
            placeItem.marker.setMap(null);
        });
        for (i = 0; i < self.placesList().length; i++) {
            var input = self.query().toLowerCase();
            if (self.placesList()[i].name.toLowerCase().indexOf(input) !== -1) {
                self.placesList()[i].visible(true);
                self.placesList()[i].marker.setMap(map);
            }
        }
    }
    // This function will make the selected marker bounce
    self.toggleBounce = function(placeItem) {
        self.placesList().forEach(function (placeItem) {
            if (placeItem.marker.getAnimation() !== null) {
                placeItem.marker.setAnimation(null);
            }
        })
        placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
          
    }
    // This is hamburger menu functionality. Toggle side panel visibility.
    self.toggleMenu = function() {
        $('.side-panel').toggle();
    }
      

}