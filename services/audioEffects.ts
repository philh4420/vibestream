
import { AudioFilterType } from '../types';

export const createAudioContext = () => {
  // @ts-ignore
  const Ctx = window.AudioContext || window.webkitAudioContext;
  return new Ctx();
};

export const applyAudioFilter = (
  ctx: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  filterType: AudioFilterType
) => {
  switch (filterType) {
    case 'cyber': {
      // Slap-back Delay + Reverb Feel
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.15; // 150ms delay

      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 800;

      // Routing: Source -> Split -> (Dry) -> Dest
      //                  -> (Wet) -> Delay -> Filter -> Feedback -> Delay -> Dest
      
      source.connect(destination); // Dry signal
      
      source.connect(delay);
      delay.connect(filter);
      filter.connect(feedback);
      feedback.connect(delay);
      delay.connect(destination); // Wet signal
      break;
    }

    case 'lofi': {
      // Telephone Effect: Bandpass + Compression/Distortion
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1000;
      bandpass.Q.value = 1.0;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      // Slight noise/distortion simulation via gain boost then clip? 
      // Keeping it simple with filters for now to avoid harshness
      
      source.connect(bandpass);
      bandpass.connect(compressor);
      compressor.connect(destination);
      break;
    }

    case 'deep': {
      // Lowpass + Dark Reverb simulation
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 600;
      
      const gain = ctx.createGain();
      gain.gain.value = 1.5; // Boost volume as lowpass cuts energy

      source.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(destination);
      break;
    }

    case 'raw':
    default:
      source.connect(destination);
      break;
  }
};

export const analyzeAudio = (ctx: AudioContext, source: AudioNode) => {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 64; // Low resolution for the "pill" visual
  source.connect(analyser);
  return analyser;
};
