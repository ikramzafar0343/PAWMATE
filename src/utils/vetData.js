export const vets = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialization: "General Practice",
    rating: 4.9,
    reviews: 124,
    location: "Sunshine Animal Hospital",
    city: "New York, NY",
    distance: "1.2 miles",
    available: true,
    availableThisWeekend: true,
    fee: 65,
    image: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialization: "Dermatology Specialist",
    rating: 4.8,
    reviews: 89,
    location: "PetCare Center",
    city: "New York, NY",
    distance: "2.5 miles",
    available: false,
    nextAvailable: "Tomorrow",
    availableThisWeekend: false,
    fee: 80,
    image: "https://images.unsplash.com/photo-1531123897727-8f129e0b1215?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 3,
    name: "Dr. Emily Wilson",
    specialization: "Surgery",
    rating: 5.0,
    reviews: 56,
    location: "City Vet Clinic",
    city: "New York, NY",
    distance: "0.8 miles",
    available: true,
    availableThisWeekend: true,
    fee: 90,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    id: 4,
    name: "Dr. James Brown",
    specialization: "Dentistry",
    rating: 4.7,
    reviews: 210,
    location: "Healthy Paws",
    city: "New York, NY",
    distance: "3.1 miles",
    available: false,
    nextAvailable: "Monday",
    availableThisWeekend: false,
    fee: 55,
    image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  }
];

export const getVets = () => vets;

export const getVetById = (id) => vets.find(v => v.id === id);
