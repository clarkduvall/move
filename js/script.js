$(function() {
  var $canvas = $('#canvas'),
      canvas = $canvas[0],
      editor = CodeMirror($('#demo')[0], {
        mode: "javascript",
        matchBrackets: true,
        lineNumbers: true,
        theme: 'green',
        tabSize: 2,
        extraKeys: {
          Tab: function(cm) {
            cm.replaceSelection("  ", "end");
          }
        }
      }),
      update = _.debounce(function() {
        var code = editor.getValue();
        try {
          eval(code);
        } catch (e) {
          console.log(e);
        }
      }, 1000),
      $canvas = $('#canvas'),
      ctx = $canvas[0].getContext('2d'),
      height = $('.CodeMirror').height();

  canvas.width = $canvas.width();
  canvas.style.width = $canvas.width() + 'px';
  canvas.height = height;
  canvas.style.height = height + 'px';

  function getScript(name) {
    $.getScript('examples/' + name).done(function(script) {
      editor.off('change', update);
      editor.setValue(script);
      editor.on('change', update);

      ctx.clearRect(0, 0, $canvas.width(), $canvas.height());
    });
  }

  $.getJSON('examples/list.json').done(function(data) {
    var $select = $('#select');
    _.each(data, function(name) {
      $select.append($('<option></option>').val(name).html(name));
    });
    $select.change(function() {
      getScript($select.find(':selected').val());
    });
    $select.change();
  });
});
