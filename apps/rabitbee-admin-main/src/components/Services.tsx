import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShoppingCart, UtensilsCrossed, Car, Beef } from "lucide-react";

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description, index }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true });
  
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="service-card p-6 md:p-8"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex flex-col h-full"
      >
        <div className="mb-6">
          <div className="p-3 bg-rabitbee/20 inline-block rounded-xl">
            <div className="w-10 h-10 text-rabitbee">
              {icon}
            </div>
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/70 flex-grow">{description}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 py-2 px-4 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/10 hover:bg-white/20 transition-all text-sm flex items-center justify-center"
        >
          Learn More
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
            className="ml-2"
          >
            →
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const Services: React.FC = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });
  
  const services = [
    {
      icon: <UtensilsCrossed className="w-full h-full" />,
      title: "Food Delivery",
      description: "Get your favorite meals delivered from local restaurants right to your doorstep within minutes."
    },
    {
      icon: <ShoppingCart className="w-full h-full" />,
      title: "Grocery Booking",
      description: "Shop groceries online and have them delivered to your home, saving you time and effort."
    },
    {
      icon: <Car className="w-full h-full" />,
      title: "Car Wash",
      description: "Book professional car wash services and get your vehicle cleaned and shining without leaving home."
    },
    {
      icon: <Beef className="w-full h-full" />,
      title: "Meat Products",
      description: "Order premium quality meat products from trusted suppliers, delivered fresh and safely."
    }
  ];

  return (
    <section id="services" className="py-20 px-6 md:px-12 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-rabitbee/10 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-80 h-80 bg-rabitbee/10 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <div className="container mx-auto" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Our <span className="text-rabitbee">Services</span>
          </motion.h2>
          <motion.p 
            className="text-white/70 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            We provide a wide range of services to make your everyday life easier and more convenient.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
