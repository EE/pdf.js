// Minimal PDF rendering and text-selection example using PDF.js by Vivin Suresh Paliath (http://vivin.net)
// This example uses a built version of PDF.js that contains all modules that it requires.
//
// The problem with understanding text selection was that the text selection code has heavily intertwined
// with viewer.html and viewer.js. I have extracted the parts I need out of viewer.js into a separate file
// which contains the bare minimum required to implement text selection. The key component is TextLayerBuilder,
// which is the object that handles the creation of text-selection divs. I have added this code as an external
// resource.
//
// This demo uses a PDF that only has one page. You can render other pages if you wish, but the focus here is
// just to show you how you can render a PDF with text selection. Hence the code only loads up one page.
//
// The CSS used here is also very important since it sets up the CSS for the text layer divs overlays that
// you actually end up selecting.

(function () {
  'use strict';

  if (typeof PDFJS === 'undefined') {
    alert('Built version of pdf.js is not found\nPlease run `node make generic`');
    return;
  }
  var pdf, pagesNum, currentPage;

  var scale = 1; //Set this to whatever you want. This is basically the "zoom" factor for the PDF.
  PDFJS.workerSrc = '../../build/generic/build/pdf.worker.js';
//    PDFJS.disableWorker = true;

  window.loadPdf = function loadPdf(pdfPath) {
    PDFJS.getDocument(pdfPath).then(renderPdf);
  };

  window.renderPdf = function renderPdf(pdfDoc) {
    console.log('pages', pdfDoc.numPages);
    pagesNum = pdfDoc.numPages;
    pdf = pdfDoc;
    switchToPage(1);
  };

  window.switchToPage = function switchToPage(pageNum) {
    if (pageNum > 0 && pageNum <= pagesNum) {
      currentPage = pageNum;
      console.log('new page', currentPage);
      pdf.getPage(pageNum).then(renderPage);
    }
  };

  window.renderPage = function renderPage(page) {
    var viewport = page.getViewport(scale);
    var $canvas = jQuery("<canvas></canvas>");

    // Set the canvas height and width to the height and width of the viewport
    var canvas = $canvas.get(0);
    var context = canvas.getContext("2d");

    // The following few lines of code set up scaling on the context if we are on a HiDPI display
    var outputScale = getOutputScale(context);
    canvas.width = (Math.floor(viewport.width) * outputScale.sx) | 0;
    canvas.height = (Math.floor(viewport.height) * outputScale.sy) | 0;
    canvas.style.width = Math.floor(viewport.width) + 'px';
    canvas.style.height = Math.floor(viewport.height) + 'px';

    // Append the canvas to the pdf container div
    var $pdfContainer = jQuery("#pdfContainer");
    $pdfContainer.css("height", canvas.style.height)
      .css("width", canvas.style.width);
    $pdfContainer.empty().append($canvas);

    var canvasOffset = $canvas.offset();
    var $textLayerDiv = jQuery("<div />")
      .addClass("textLayer")
      .css("height", canvas.style.height)
      .css("width", canvas.style.width)
      .offset({
        top: canvasOffset.top,
        left: canvasOffset.left
      });

    context._scaleX = outputScale.sx;
    context._scaleY = outputScale.sy;
    if (outputScale.scaled) {
      context.scale(outputScale.sx, outputScale.sy);
    }

    $pdfContainer.append($textLayerDiv);

    page.getTextContent().then(function (textContent) {
      var textLayer = new TextLayerBuilder({
        textLayerDiv: $textLayerDiv.get(0),
        viewport: viewport,
        pageIndex: 0
      });
      textLayer.setTextContent(textContent);

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext);
    });
  };

  window.onload = function () {
    loadPdf('../../web/compressed.tracemonkey-pldi-09.pdf');
//    loadPdf('../text-selection/pdf/TestDocument.pdf');

    $('#prev-page').on('click', function () {
      switchToPage(currentPage - 1);
    });

    $('#next-page').on('click', function () {
      switchToPage(currentPage + 1);
    });

    $('#scale').on('change', function () {
      scale = parseInt(this.value);
      switchToPage(currentPage);
    });
  };

})();
