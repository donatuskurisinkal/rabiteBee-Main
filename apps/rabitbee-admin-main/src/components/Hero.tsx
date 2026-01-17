import React, { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

const Hero: React.FC = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
      {/* Background floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5 backdrop-blur-sm"
            style={{
              width: `${Math.random() * 150 + 50}px`,
              height: `${Math.random() * 150 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 40 - 20],
              y: [0, Math.random() * 40 - 20],
              rotate: [0, Math.random() * 20 - 10],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2" ref={ref}>
            <motion.div
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, x: -50 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { 
                    duration: 0.8,
                    staggerChildren: 0.2
                  }
                }
              }}
              className="space-y-6"
            >
              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6 }
                  }
                }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight"
              >
                <span className="text-rabitbee">Fast</span> Delivery,<br />
                <span className="text-rabitbee">Happy</span> Living
              </motion.h1>
              
              <motion.p
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6 }
                  }
                }}
                className="text-xl text-white/80 max-w-md"
              >
                Your everyday needs delivered to your doorstep with lightning speed. From food to groceries, we've got you covered.
              </motion.p>
              
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6 }
                  }
                }}
                className="flex flex-wrap gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-rabitbee text-white py-3 px-8 rounded-full button-shine"
                >
                  Order Now
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/10 backdrop-blur-sm text-white border border-white/20 py-3 px-8 rounded-full hover:bg-white/20 transition-all"
                >
                  Learn More
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
          
          <div className="md:w-1/2 mt-12 md:mt-0">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.5
              }}
              className="relative"
            >
              <div className="relative z-10">
                <motion.div
                  className="w-64 h-64 md:w-80 md:h-80 bg-white/10 backdrop-blur-md rounded-full mx-auto relative"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 50,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl md:text-7xl font-bold text-rabitbee">RB</div>
                  </div>
                  
                  {/* Orbiting Elements */}
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                      style={{
                        transformOrigin: "center center",
                        top: "calc(50% - 24px)",
                        left: "calc(50% - 24px)",
                      }}
                      initial={{ rotate: deg, translateX: 160 }}
                      animate={{
                        rotate: [deg, deg + 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <motion.div 
                        className="w-8 h-8 bg-rabitbee rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              
              {/* Blob shapes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
                <motion.div
                  className="absolute top-0 left-0 w-64 h-64 bg-rabitbee/30 rounded-full filter blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    x: [0, -30, 0],
                    y: [0, 20, 0]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 w-56 h-56 bg-rabitbee-light/20 rounded-full filter blur-3xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 20, 0],
                    y: [0, -30, 0]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    repeatType: "reverse"
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

export default Hero;
