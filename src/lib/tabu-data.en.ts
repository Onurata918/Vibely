import type { TabuCard } from './tabu-data';

// Taboo (EN) — the describer explains "word" but can't say any of the "taboo" words.
// Same length/order as TABU_CARDS in tabu-data.ts, with English-native taboo clues.
export const TABU_CARDS_EN: readonly TabuCard[] = [
  { word: 'Coffee', taboo: ['Hot', 'Drink', 'Cup', 'Morning', 'Tea'] },
  { word: 'Sea', taboo: ['Water', 'Blue', 'Sand', 'Fish', 'Vacation'] },
  { word: 'School', taboo: ['Student', 'Class', 'Classroom', 'Teacher', 'Exam'] },
  { word: 'Phone', taboo: ['Call', 'Screen', 'App', 'Text', 'Charger'] },
  { word: 'Movie Theater', taboo: ['Film', 'Ticket', 'Seat', 'Screen', 'Popcorn'] },
  { word: 'Cat', taboo: ['Meow', 'Pet', 'Fur', 'Paw', 'Dog'] },
  { word: 'Snow', taboo: ['White', 'Cold', 'Winter', 'Snowball', 'Ice'] },
  { word: 'Birthday', taboo: ['Cake', 'Candle', 'Gift', 'Celebration', 'Party'] },
  { word: 'Soccer', taboo: ['Ball', 'Goal', 'Field', 'Net', 'Match'] },
  { word: 'Airplane', taboo: ['Airport', 'Pilot', 'Fly', 'Ticket', 'Sky'] },
  { word: 'Grocery Store', taboo: ['Shopping', 'Checkout', 'Product', 'Cart', 'Price'] },
  { word: 'Sleep', taboo: ['Bed', 'Dream', 'Blanket', 'Night', 'Nap'] },
  { word: 'Doctor', taboo: ['Hospital', 'Checkup', 'Medicine', 'White Coat', 'Prescription'] },
  { word: 'Guitar', taboo: ['String', 'Music', 'Play', 'Note', 'Instrument'] },
  { word: 'Rain', taboo: ['Umbrella', 'Wet', 'Cloud', 'Rainbow', 'Drop'] },
  { word: 'Book', taboo: ['Page', 'Read', 'Author', 'Library', 'Novel'] },
  { word: 'Vacation', taboo: ['Beach', 'Plane', 'Suitcase', 'Hotel', 'Relax'] },
  { word: 'Bicycle', taboo: ['Wheel', 'Pedal', 'Chain', 'Ride', 'Two-Wheeled'] },
  { word: 'Breakfast', taboo: ['Morning', 'Bread', 'Cheese', 'Tea', 'Egg'] },
  { word: 'Wedding', taboo: ['Bride', 'Groom', 'Ceremony', 'Ring', 'Celebration'] },
];
