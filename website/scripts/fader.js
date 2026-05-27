function fadeInPage() {
    if (!window.AnimationEffect) {return;}
    var fader = document.getElementById('fader');
    fader.classList.add('fade-out');

}
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.AnimationEvent) { return; }
        var anchors = document.getElementsByTagName('a');
    
        for (var idx=0; idx<anchors.length; idx+=1) {
            // Links to other websites and links to anchors on the same page are disregarded:
            if (anchors[idx].hostname !== window.location.hostname ||
                anchors[idx].pathname === window.location.pathname) {
                continue;
            }
            anchors[idx].addEventListener('click', function(event) {
                var fader = document.getElementById('fader'),
                    anchor = event.currentTarget;
                
                var listener = function() {
                    window.location = anchor.href;
                    fader.removeEventListener('animationend', listener);
                };
                fader.addEventListener('animationend', listener);
                
                event.preventDefault();
                fader.classList.add('fade-in');
            });
        }
    });

    /* Some browsers, especially Safari, use cached versions of a 
    webpage when navigating the browser history. Since the page was faded out, 
    it will be displayed as such when going back to it. We need to clean up in this case:*/
    window.addEventListener('pageshow', function (event) {
        if (!event.persisted) {
          return;
        }
        var fader = document.getElementById('fader');
        fader.classList.remove('fade-in');
      });