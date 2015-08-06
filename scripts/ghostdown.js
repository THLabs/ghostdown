require.config({
    packages: [
        {
            name: 'codemirror',
            location: 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.5.0',
            main: 'codemirror.min'
   }],
    // for some reason, the mardown mode in codemirror is looking for the
    // master codemirror file in the wrong place. This map fixes it.
    map: {
        'codemirror': {
            'codemirror/lib/codemirror': 'codemirror'
        }
    },
    paths: {
        showdown: 'https://cdnjs.cloudflare.com/ajax/libs/showdown/1.2.2/showdown.min',
        dropzone: 'https://cdnjs.cloudflare.com/ajax/libs/dropzone/4.0.1/min/dropzone.min'
    },
    shim: {
        'dropzone': {
            exports: 'Dropzone'
        }
    }
});

require([
    "codemirror",
    "showdown",
    "dropzone",
    "codemirror/mode/markdown/markdown.min"
], function (CodeMirror, showdown, Dropzone) {
    'use strict';
    console.log("loaded: ");
    console.log(CodeMirror);
    console.log(showdown);
    console.log(Dropzone);

    var textarea = document.querySelector('#ghostdown-editor');
    var preview = document.querySelector('#ghostdown-rendered');
    var converter = new showdown.Converter();
    var editor = CodeMirror.fromTextArea(textarea, {
        mode: 'markdown',
        tabMode: 'indent',
        lineWrapping: true
    });


    function updateImagePlaceholders() {
        var imgPlaceholders = (Array.prototype.slice.call(document.querySelectorAll('ghostdown-rendered p'))).filter(function (p) {
            return (/^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim).test(p.innerText);
        });
        Dropzone.autoDiscover = false;

        imgPlaceholders.forEach(
            function (element, index) {
                element.setAttribute("class", "dropzone");

                var dropzone = new Dropzone(element, {
                    url: "/content/upload",
                    success: function (file, response) {
                        var holderP = file.previewElement.closest("p");
                        var preList = Array.prototype.slice.call(document.querySelectorAll('.CodeMirror-code pre'));
                        var imgHolderMarkdown = preList.filter(function (element) {
                            return (/^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(?:\(([^\n\]]*)\))?$/gim).test(element.textContent) && (element.querySelectorAll('span').length === 0);
                        });

                        var editorOrigVal = editor.getValue();
                        var nth = 0;
                        var newMarkdown = editorOrigVal.replace(/^(?:\{<(.*?)>\})?!(?:\[([^\n\]]*)\])(:\(([^\n\]]*)\))?$/gim, function (match, i, original) {
                            nth++;
                            return (nth === (index + 1)) ? (match + "(" + response.path + ")") : match;
                        });
                        editor.setValue(newMarkdown);

                        holderP.classList.remove("dropzone");
                        holderP.innerHTML = '<img src="' + response.path + '"/>';
                    }
                });
            }
        );
    }

    function updatePreview() {
        preview.innerHTML = converter.makeHtml(editor.getValue());
        updateImagePlaceholders();
    }

    editor.on("change", function () {
        updatePreview();
        syncScroll();
    });

    updatePreview();

    function syncScroll() {
        var codeViewport = document.querySelector('.CodeMirror-scroll'),
            previewViewport = document.querySelector('#ghostdown-preview'),
            codeContent = document.querySelector('.CodeMirror-sizer'),
            previewContent = document.querySelector('#ghostdown-rendered'),

            codeHeight = codeContent.clientHeight - window.getComputedStyle(codeViewport, null).height.split("px")[0],
            // TODO: for some reason, this needs a 50px 'bodge' to make it scroll to the bottom properly
            previewHeight = previewContent.clientHeight - window.getComputedStyle(previewViewport, null).height.split("px")[0] + 50,
            ratio = previewHeight / codeHeight,
            previewPostition = codeViewport.scrollTop * ratio;
        

        previewViewport.scrollTop = previewPostition;
        
        console.log( "code.clientHeight: "+codeContent.clientHeight+" , codeViewport.computedStyle: "+window.getComputedStyle(codeViewport, null).height );
        console.log( "preview.clientHeight: "+previewContent.clientHeight+" , previewViewport.computedStyle: "+window.getComputedStyle(previewViewport, null).height );
        console.log( "code.scrollTop: "+codeViewport.scrollTop+", preview.scrollTop: "+previewViewport.scrollTop);
    }

    document.querySelector('.CodeMirror-scroll').onscroll = syncScroll;
});