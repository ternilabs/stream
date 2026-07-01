import { SourceDefinition } from './types';

export const SOURCES: SourceDefinition[] = [
  { id: 'mapple', name: 'Mapple', movieTemplate: 'https://mapple.uk/watch/movie/{id}?autoPlay=true', tvTemplate: 'https://mapple.uk/watch/tv/{id}-{season}-{episode}?autoPlay=true' },
  { id: 'superembed', name: 'SuperEmbed', movieTemplate: 'https://multiembed.mov/?video_id={id}&tmdb=1', tvTemplate: 'https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}' },
  { id: 'vidlink', name: 'VidLink', movieTemplate: 'https://vidlink.pro/movie/{id}', tvTemplate: 'https://vidlink.pro/tv/{id}/{season}/{episode}' },
  { id: 'vidsrc', name: 'VidSrc', movieTemplate: 'https://vidsrc.su/movie/{id}', tvTemplate: 'https://vidsrc.su/tv/{id}/{season}/{episode}' },
  { id: '2embed', name: '2Embed', movieTemplate: 'https://www.2embed.cc/embed/{id}', tvTemplate: 'https://www.2embed.cc/embedtv/{id}&s={season}&e={episode}' },
  { id: '111movies', name: '111Movies', movieTemplate: 'https://111movies.net/movie/{id}', tvTemplate: 'https://111movies.net/tv/{id}/{season}/{episode}' },
  { id: 'vidfast', name: 'VidFast', movieTemplate: 'https://vidfast.pro/movie/{id}?autoPlay=true', tvTemplate: 'https://vidfast.pro/tv/{id}/{season}/{episode}?autoPlay=true' },
  { id: 'vidzee', name: 'Vidzee', movieTemplate: 'https://player.vidzee.wtf/embed/movie/{id}', tvTemplate: 'https://player.vidzee.wtf/embed/tv/{id}/{season}/{episode}' },
  { id: 'spencerdevs', name: 'SpencerDevs', movieTemplate: 'https://spencerdevs.xyz/movie/{id}?theme=00ffc9', tvTemplate: 'https://spencerdevs.xyz/tv/{id}/{season}/{episode}?theme=00ffc9' },
  { id: 'xpass', name: 'XPass', movieTemplate: 'https://play.xpass.top/e/movie/{id}', tvTemplate: 'https://play.xpass.top/e/tv/{id}/{season}/{episode}' },
  { id: 'vidcore', name: 'VidCore', movieTemplate: 'https://vidcore.net/movie/{id}?autoPlay=true', tvTemplate: 'https://vidcore.net/tv/{id}/{season}/{episode}?autoPlay=true' },
  { id: 'cinemaos', name: 'CinemaOS', movieTemplate: 'https://cinemaos.tech/player/{id}?theme=ffffff', tvTemplate: 'https://cinemaos.tech/player/{id}/{season}/{episode}?theme=ffffff' },
  { id: 'airflix', name: 'AirFlix', movieTemplate: 'https://airflix1.com/embed/movie/{id}', tvTemplate: 'https://airflix1.com/embed/tv/{id}/{season}/{episode}' },
  { id: 'peachify', name: 'Peachify', movieTemplate: 'https://peachify.top/embed/movie/{id}', tvTemplate: 'https://peachify.top/embed/tv/{id}/{season}/{episode}' },
  { id: 'vidzen', name: 'VidZen', movieTemplate: 'https://vidzen.fun/movie/{id}', tvTemplate: 'https://vidzen.fun/tv/{id}/{season}/{episode}' },
  { id: 'vidplays', name: 'VidPlays', movieTemplate: 'https://vidplays.fun/embed/movie/{id}', tvTemplate: 'https://vidplays.fun/embed/tv/{id}/{season}/{episode}' },
  { id: 'videasy', name: 'VidEasy', movieTemplate: 'https://player.videasy.net/movie/{id}', tvTemplate: 'https://player.videasy.net/tv/{id}/{season}/{episode}' },
  { id: 'zxcstream', name: 'ZXCStream', movieTemplate: 'https://zxcstream.xyz/player/movie/{id}', tvTemplate: 'https://zxcstream.xyz/player/tv/{id}/{season}/{episode}' },
];
