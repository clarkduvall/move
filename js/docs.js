$(function() {
  function scroll($e) {
    $('html,body').animate({
      scrollTop: $e.offset().top
    }, 500);
  }

  $('.toc-top').click(function(e) {
    var $this = $(this),
        etoggle;

    e.preventDefault();

    toggle = $this.data('toggle');
    $('#inner-' + toggle).show();
    scroll($('#' + toggle));
  });

  $('a[data-parent]').click(function(e) {
    var $this = $(this),
        toggle;

    e.preventDefault();

    toggle = $this.data('parent');
    $('#inner-' + toggle).show();
    scroll($($this.attr('href')));
  });

  $('.docs-toggle').click(function(e) {
    var $this = $(this);

    e.preventDefault();

    $('#inner-' + $this.data('toggle')).animate({height: 'toggle'}, 300);
  });

  $('.docs-toggle').each(function() {
    $('#inner-' + $(this).data('toggle')).animate({height: 'hide'}, 0);
  });
});
