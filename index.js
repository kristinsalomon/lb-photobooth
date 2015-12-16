require('dotenv').load();
var chokidar = require('chokidar');
var Flickr = require('flickrapi');

var flickrOptions = {
  api_key: process.env.FLICKR_API_KEY,
  secret: process.env.FLICKR_SECRET,
  user_id: process.env.FLICKR_USER_ID,
  access_token: process.env.FLICKR_ACCESS_TOKEN,
  access_token_secret: process.env.FLICKR_ACCESS_TOKEN_SECRET,
  permissions: 'write'
};

var photosetID = '72157662485285495' // hardcoded album ID
var photoID; //photo ID will change every upload

//change directory name to watch here
var watchDirname = '.\\photos';
var watchOptions = {
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
}
var watcher = chokidar.watch(watchDirname, watchOptions);

// Create the photoset
//Flickr.authenticate(flickrOptions, function(err, flickr){
//check photosets first
//var albumExists = checkPhotoset(flickr);
//console.log(albumExists);
//Create photoset if it doesn't exist
// if(!albumExists){
//   var photosetID = createPhotoset(flickr);
// }
//});

//Start watching folder
watcher.on('add', function(event, path){
  var fullFilename = event;
  //console.log('full filename: ' + event);
  var filename = event.split('\\').pop();
  //console.log('file: ' + filename);

  Flickr.authenticate(flickrOptions, function(err, flickr){
    //use "flickr" as API object here
    var uploadOptions = {
      photos: [{
        title: filename,
        description: 'littleBits Holiday Party 2015',
        tags: ['2015', 'holiday party', 'photobooth'],
        photo: fullFilename,
        is_public: '1',
        hidden: '2'
      }]
    };

    Flickr.upload(uploadOptions, flickrOptions, function(err, result){
      console.log('Uploading photo...')
      if (err) {
        return console.error(err);
      }
      else {
        photoID = result.toString().replace(/[\[\]']+/g,'').toString();
        console.log(photoID + ' uploaded to Flickr');

        addPhotoToAlbum(flickr, photoID);
      }
    });
  });
});

function addPhotoToAlbum(flickr, photoID){
  console.log('Adding photo to album...')
  var addPhotoOptions = {
    api_key: process.env.FLICKR_API_KEY,
    photoset_id: photosetID,
    photo_id: photoID
  }

  flickr.photosets.addPhoto(addPhotoOptions, function(err, result){
    if(err){
      console.error(err);
    }
    else {
      console.log(photoID + ' added to album');
    }
  })
}

//Not using these functions...

function checkPhotoset(flickr){
  console.log('Checking for photoset...')
  var matchTitle = 'Holiday Party 2014'
  var foundAlbum;
  var getPhotosetListOptions = {
    api_key: process.env.FLICKR_API_KEY,
    user_id: process.env.FLICKR_USER_ID
  };

  flickr.photosets.getList(getPhotosetListOptions, function(err, result){
    if (err){
      console.error(err);
    }
    else{
      var jsonData = JSON.parse(JSON.stringify(result));
      var numAlbums = jsonData.photosets.total;

      for(var i=0; i < numAlbums; i++){
        var title = jsonData.photosets.photoset[0].title._content
        if(title === matchTitle){
          console.log('Existing album found.')
          foundAlbum = true; //found album
          break;
        }
        else { foundAlbum = false; } //no matching album
      }
    }
    console.log(foundAlbum)
  })

  return foundAlbum;
}

function createPhotoset(flickr){
  console.log('Creating photoset...')
  var photosetID, photosetURL;
  var createPhotosetOptions = {
    api_key: process.env.FLICKR_API_KEY,
    title: 'littleBits Holiday Party 2015',
    description: 'Photobooth pictures from the Holiday Party, Dec. 17 2015 @ littleBits HQ',
    primary_photo_id: '23422856219' //Holidaypartyinvite
  };

  flickr.photosets.create(createPhotosetOptions, function (err, result){
    if (err){
      console.error(err);
    }
    else{
      photosetID = JSON.parse(JSON.stringify(result)).photoset.id;
      //console.log(photosetID);
      photosetURL = JSON.parse(JSON.stringify(result)).photoset.url;
      //console.log(photosetURL);
    }
  })
  return photosetID
}
