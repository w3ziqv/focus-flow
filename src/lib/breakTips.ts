import type { Lang } from '../domain/language'

export interface BreakTip {
  title: Record<Lang, string>
  description: Record<Lang, string>
}

export const BREAK_TIPS: BreakTip[] = [
  {
    title: { pl: 'Przewietrz pokój', en: 'Air out the room', es: 'Ventila la habitación', zh: '给房间通通风' },
    description: {
      pl: 'Jeśli w pokoju jest duszno, a warunki na zewnątrz na to pozwalają, otwórz na chwilę okno.',
      en: 'If the room feels stuffy and outdoor conditions allow, open a window briefly.',
      es: 'Si el ambiente está cargado y las condiciones del exterior lo permiten, ventila un momento.',
      zh: '如果室内感觉闷，而且室外条件合适，可以短暂开窗通风。',
    },
  },
  {
    title: { pl: 'Spójrz w dal', en: 'Look into the distance', es: 'Mira a lo lejos', zh: '看看远处' },
    description: {
      pl: 'Zrób przerwę od patrzenia z bliska. Przez chwilę popatrz na oddalony przedmiot, zamiast na kolejny ekran.',
      en: 'Take a break from close-up work. Look at something farther away for a moment instead of switching to another screen.',
      es: 'Descansa de mirar de cerca. Mira un objeto lejano durante un momento en lugar de cambiar de pantalla.',
      zh: '让双眼暂时离开近处的屏幕，看看较远的物体，而不是换到另一块屏幕。',
    },
  },
  {
    title: { pl: 'Zmień pozycję', en: 'Change position', es: 'Cambia de postura', zh: '换个姿势' },
    description: {
      pl: 'Jeśli możesz, wstań i przejdź kilka kroków. Możesz też delikatnie poruszać ramionami, pozostając na krześle.',
      en: 'If you can, stand up and take a few steps. You can also move your shoulders gently while seated.',
      es: 'Si puedes, levántate y da unos pasos. También puedes mover suavemente los hombros sin salir de la silla.',
      zh: '如果方便，可以站起来走几步，也可以坐在椅子上轻轻活动肩膀。',
    },
  },
  {
    title: { pl: 'Sprawdź, czy chce Ci się pić', en: 'Check whether you are thirsty', es: 'Comprueba si tienes sed', zh: '留意自己是否口渴' },
    description: {
      pl: 'Przerwa to dobra chwila na kilka łyków wody. Postaw napój w zasięgu ręki, jeśli pomaga Ci to o nim pamiętać.',
      en: 'A break is a useful time for a few sips of water. Keep a drink within reach if that helps you remember it.',
      es: 'La pausa puede servir para beber un poco de agua. Deja una bebida a mano si te ayuda a recordarlo.',
      zh: '休息时可以喝几口水。如果有帮助，就把饮水放在随手可及的位置。',
    },
  },
]

export function randomBreakTip(): BreakTip {
  return BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)]
}
