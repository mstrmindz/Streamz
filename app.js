const videoElement = document.getElementById("videoPlayer");
const mediaSource = new MediaSource();
mediaSource.addEventListener("sourceopen", handleSourceOpen, false);
videoElement.src = URL.createObjectURL(mediaSource);

function handleSourceOpen() {
  const mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
  const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
  sourceBuffer.mode = "segments";

  fetch(
    "https://streamzbucket01.s3.amazonaws.com/DaniLeigh+-+Easy+ft.+Chris+Brown+(Remix).mp4"
  )
    .then((response) => response.body)
    .then((body) => {
      const reader = body.getReader();
      const streamController = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ value, done }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(new Uint8Array(value));
              push();
            });
          }
          push();
        },
      });

      const videoStream = streamController.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            sourceBuffer.addEventListener("updateend", () => {
              if (sourceBuffer.updating && !sourceBuffer.timedOut) {
                return;
              }
              sourceBuffer.appendBuffer(chunk);
            });
            controller.enqueue(chunk);
          },
        })
      );

      videoStream.pipeTo(sourceBuffer);
    });
}
