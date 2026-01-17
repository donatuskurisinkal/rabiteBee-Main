import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Shield, TrendingUp, Trophy } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      <div className="w-14 h-14 rounded-full bg-rabitbee/20 flex items-center justify-center mb-5 text-rabitbee">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </motion.div>
  );
};

const About: React.FC = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });
  
  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Lightning Fast Delivery",
      description: "We deliver your orders in record time, ensuring your food stays hot and your groceries fresh."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Safe & Secure",
      description: "Your safety is our priority with contactless delivery and secure payment options."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Real-time Tracking",
      description: "Track your delivery in real-time and know exactly when your order will arrive."
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Top-rated Service",
      description: "Join thousands of satisfied customers who rely on our premium delivery service."
    }
  ];

  return (
    <section id="about" className="py-20 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-rabitbee/10 rounded-full filter blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 bg-rabitbee/10 rounded-full filter blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <div className="container mx-auto" ref={sectionRef}>
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.h2 
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            About <span className="text-rabitbee">RabitBee</span>
          </motion.h2>
          <motion.p 
            className="text-white/70 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            We're revolutionizing the delivery experience with cutting-edge technology and exceptional service. Our mission is to make your life easier one delivery at a time.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
        
        <div className="flex flex-col lg:flex-row items-center bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="lg:w-1/2 p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Trusted by Thousands <span className="text-rabitbee">Across the Country</span>
              </h3>
              <p className="text-white/70 mb-6">
                RabitBee has quickly become the go-to delivery service for people who value quality, speed, and reliability. Our expanding network of partners means we can bring more of what you love right to your doorstep.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-3xl font-bold text-rabitbee">10k+</div>
                  <div className="text-white/70">Daily Orders</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-rabitbee">1.5k+</div>
                  <div className="text-white/70">Delivery Partners</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-rabitbee">50+</div>
                  <div className="text-white/70">Cities Covered</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-rabitbee">4.8/5</div>
                  <div className="text-white/70">User Rating</div>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-rabitbee text-white py-3 px-8 rounded-full button-shine"
              >
                Learn More About Us
              </motion.button>
            </motion.div>
          </div>
          
          <div className="lg:w-1/2 h-full">
            <motion.div
              className="h-full min-h-[300px] bg-rabitbee-bg relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-64 h-64 bg-white/5 backdrop-blur-lg rounded-full flex items-center justify-center overflow-hidden relative"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 40,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <motion.div
                    className="absolute inset-0 border-t-4 border-rabitbee rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  
                  {/* Inner circle with logo */}
                  <div className="w-40 h-40 bg-rabitbee-bg rounded-full flex items-center justify-center border border-white/20 z-10">
                    <div className="text-4xl font-bold">
                      <span className="text-rabitbee">RB</span>
                    </div>
                  </div>
                  
                  {/* Orbiting elements */}
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-6 h-6 bg-rabitbee rounded-full"
                      style={{
                        transformOrigin: "center center",
                      }}
                      initial={{ 
                        rotate: deg,
                        translateX: 120,
                      }}
                      animate={{
                        rotate: [deg, deg + 360],
                      }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </motion.div>
              </div>
              
              {/* Background design elements */}
              <div className="absolute top-10 left-10">
                <motion.div 
                  className="w-20 h-20 rounded-full bg-rabitbee/20"
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <div className="absolute bottom-10 right-10">
                <motion.div 
                  className="w-32 h-32 rounded-full bg-rabitbee/10"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 10, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
