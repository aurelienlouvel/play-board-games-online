export type SectionRegles = { titre: string; texte: string; image: string | null }
export type ContenuRegles = { intro: string; sections: SectionRegles[]; videoId: string | null }

export const REGLES_PAR_DEFAUT: ContenuRegles = {
  intro: "De 2 à 6 joueurs. Remportez le plus de plis en posant la carte la plus haute.",
  videoId: null,
  sections: [
    {
      titre: "But du jeu",
      texte: "Chaque pli remporté rapporte **1 point**. Après le nombre de manches choisi par l'hôte, le joueur qui a le plus de points l'emporte.",
      image: null,
    },
    {
      titre: "Mise en place",
      texte: "Le paquet compte 40 cartes : 4 couleurs, valeurs 1 à 10.\n\nChaque joueur reçoit le nombre de cartes choisi dans les options (réduit si le paquet ne suffit pas).",
      image: null,
    },
    {
      titre: "Tour d'un joueur",
      texte: "À votre tour, posez une carte de votre main au centre de la table.\n\nQuand chacun a posé une carte, la plus haute remporte le pli (la plus basse avec la variante inversée). En cas d'égalité, la première posée l'emporte. Le gagnant du pli commence le suivant.",
      image: null,
    },
    {
      titre: "Fin de partie",
      texte: "Quand les mains sont vides, une nouvelle manche commence avec le joueur suivant. Après la dernière manche, le plus haut total gagne ; les ex-aequo partagent la victoire.",
      image: null,
    },
  ],
}
