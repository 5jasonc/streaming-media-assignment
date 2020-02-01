const fs = require('fs');
const path = require('path');

const handleFileError = (response, err) => {
  if (err) {
    if (err.code === 'ENOENT') response.writeHead(404);
    return response.end(err);
  }
  return false;
};

const getMediaData = (request, stats) => {
  let { range } = request.headers;

  if (!range) range = 'bytes=0-';

  const positions = range.replace(/bytes=/, '').split('-');

  let start = parseInt(positions[0], 10);
  const total = stats.size;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) start = end - 1;

  const chunkSize = (end - start) + 1;

  return {
    start, end, total, chunkSize,
  };
};

const loadFile = (request, response, filePath, contentType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    handleFileError(response, err);

    const mediaData = getMediaData(request, stats);

    response.writeHead(206, {
      'Content-Range': `bytes ${mediaData.start}-${mediaData.end}/${mediaData.total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': mediaData.chunkSize,
      'Content-Type': contentType,
    });

    const stream = fs.createReadStream(file, { start: mediaData.start, end: mediaData.end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports = {
  getParty,
  getBling,
  getBird,
};
