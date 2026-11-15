import manorEntry from './manor-entry.svg?raw';
export const GAME_NAME = 'Midnight Manor';

export function homeMarkup(canResume) {
  return `<main class="manor-home">
    <header class="manor-home-header"><a class="manor-wordmark" href="/" aria-label="Midnight Manor home"><span aria-hidden="true">M</span> MIDNIGHT MANOR</a><span class="manor-session-tag">MULTIPLAYER · SOLO WITH BOTS</span></header>
    <div class="manor-home-grid">
      <section class="manor-intro"><p class="manor-kicker">THE DOORS ARE OPEN. FOR NOW.</p><h1>Good friends.<br>Bad company.<br><em>Midnight Manor.</em></h1><p class="manor-description">One hunter. A house full of trouble.<br>Repair the machines, pull your friends out of danger, and make it to the gates.</p><div class="manor-facts"><span><b>10</b> minutes to escape</span><span><b>5</b> survivor classes</span><span><b>2</b> floors + courtyard</span></div><figure class="manor-scene"><img src="data:image/svg+xml,${encodeURIComponent(manorEntry)}" alt="A moonlit mansion with two open gates and guests sneaking through its courtyard"><figcaption>Stay close. Take a different route. Go back for a friend.</figcaption></figure></section>
      <section class="manor-play" aria-label="Play Midnight Manor"><span class="manor-kicker">YOUR NEXT BAD IDEA</span><h2>Get everyone inside.</h2><p>Start a room and share its code.<br>Playing alone? Invite bots in the lobby.</p>
        <p id="manor-server-status" role="status">Connecting to the manor… The first connection can take about a minute.</p>
        <form id="hunt-host"><label for="hunt-name">YOUR NAME</label><input id="hunt-name" maxlength="24" placeholder="What should we call you?" required autocomplete="nickname"><button class="primary">Host a hunt →</button></form>
        <div class="manor-divider"><span>OR JOIN YOUR FRIENDS</span></div>
        <form id="hunt-join"><label class="manor-sr-only" for="hunt-code">Room code</label><input id="hunt-code" maxlength="8" aria-label="Room code" placeholder="ROOM CODE" required autocomplete="off" autocapitalize="characters" spellcheck="false"><button>Join friends</button></form>
        <button id="hunt-resume" ${canResume ? '' : 'hidden'}>Resume my hunt ↗</button><p class="manor-play-note">One known hunter. Everyone else has a way to fight back.</p>
      </section>
    </div><footer class="manor-home-footer"><span>REPAIR. RESCUE. GET OUT.</span><details><summary>Keyboard controls</summary><p>WASD / arrows: move · Hold E: repair / interact · F: ability · Q: strike · M: map · L: flashlight · B: sensor · X: whip. Touch controls appear on phones.</p></details></footer>
  </main><div id="hunt-toast" hidden></div>`;
}
