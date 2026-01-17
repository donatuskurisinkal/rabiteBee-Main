
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const Download: React.FC = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });
  
  return (
    <section id="download" className="py-20 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <motion.div
          className="absolute top-40 right-20 w-96 h-96 bg-rabitbee/15 rounded-full filter blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <div className="container mx-auto" ref={sectionRef}>
        <div className="flex flex-col lg:flex-row items-center">
          <motion.div
            className="lg:w-1/2 mb-10 lg:mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="max-w-lg">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Download the <span className="text-rabitbee">RabitBee</span> App
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Get the full RabitBee experience on your mobile device. Order food, groceries, and more with just a few taps!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* App Store Button */}
                <motion.a 
                  href="https://apps.apple.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="app-button text-white"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.665 16.811a10.316 10.316 0 0 1-1.021 1.837c-.537.767-.978 1.297-1.316 1.592-.525.482-1.089.73-1.692.744-.432 0-.954-.123-1.562-.373-.61-.249-1.17-.371-1.683-.371-.537 0-1.113.122-1.73.371-.617.25-1.114.381-1.495.393-.577.019-1.153-.229-1.725-.744-.367-.32-.83-.87-1.391-1.652-.597-.829-1.086-1.789-1.466-2.881-.407-1.187-.611-2.335-.611-3.447 0-1.273.275-2.372.826-3.292a4.857 4.857 0 0 1 1.73-1.751 4.65 4.65 0 0 1 2.34-.662c.46 0 1.063.142 1.81.422s1.227.422 1.436.422c.158 0 .689-.167 1.593-.498.853-.308 1.573-.434 2.163-.384 1.6.129 2.801.759 3.6 1.895-1.43.867-2.137 2.08-2.123 3.637.012 1.213.453 2.222 1.317 3.023a4.33 4.33 0 0 0 1.315.863c-.106.307-.218.6-.336.882zM15.998 2.38c0 .95-.348 1.838-1.039 2.659-.836.976-1.846 1.541-2.941 1.452a2.955 2.955 0 0 1-.021-.36c0-.913.396-1.889 1.103-2.688.352-.404.8-.741 1.343-1.009.542-.264 1.054-.41 1.536-.435.013.128.019.255.019.381z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-xs">Download on the</span>
                    <span className="text-xl font-semibold -mt-1">App Store</span>
                  </div>
                </motion.a>

                {/* Google Play Button */}
                <motion.a 
                  href="https://play.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="app-button text-white"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.462 13.224c.316.688.825 1.245 1.415 1.617L3.844 18.15c-.135-.082-.257-.18-.37-.284C2.42 16.884 2.5 15.203 3.722 14.136l1.74-.912zm16.956-8.123l-7.361 4.453-.342.207 4.85 4.766c.898-.63 2.046-1.219 2.853-1.798 1.657-1.189 1.867-2.054 1.867-2.856 0-.807-.209-1.672-1.867-2.861zM5.8 4.75c.267-.15.498-.13.664.035l7.752 5.092-1.79 1.128L5.8 4.75zm4.428 6.167l-1.655.921 7.362 4.452c.193.112.457.128.675.01.215-.113.435-.3.648-.493l-7.03-4.89zM2.879 6.879c-.185.186-.29.44-.29.704v8.835c0 .264.105.518.29.703.186.186.44.29.704.29h1.689l3.268-3.418c-.16-.143-.303-.3-.427-.465l-5.234-5.935V7.666c.045-.012.137-.073.283-.187.177-.165.408-.366.66-.573L2.879 6.88z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-xs">GET IT ON</span>
                    <span className="text-xl font-semibold -mt-1">Google Play</span>
                  </div>
                </motion.a>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="lg:w-1/2 flex justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative w-64 md:w-80">
              {/* Phone mockup */}
              <motion.div
                className="absolute inset-0 rounded-3xl border-8 border-white/10 bg-black/50 backdrop-blur-lg shadow-xl overflow-hidden"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* App Screenshot */}
                <div className="absolute inset-0 bg-gradient-to-br from-rabitbee-bg-light to-rabitbee-bg">
                  {/* Mock UI elements */}
                  <div className="absolute top-10 left-5 right-5">
                    <div className="flex justify-between items-center">
                      <div className="text-white text-lg font-bold">RabitBee</div>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-rabitbee"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-24 left-5 right-5">
                    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl mb-4">
                      <div className="h-2 w-1/2 bg-white/30 rounded-full"></div>
                      <div className="h-2 w-3/4 bg-white/20 rounded-full mt-2"></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <motion.div 
                          key={i}
                          className="bg-white/10 backdrop-blur-sm aspect-square rounded-xl p-3 flex flex-col justify-between"
                          animate={{ scale: i === 1 ? [1, 1.05, 1] : 1 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-rabitbee/60"></div>
                          <div>
                            <div className="h-2 w-10 bg-white/30 rounded-full"></div>
                            <div className="h-2 w-8 bg-white/20 rounded-full mt-1"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-rabitbee mt-4 p-3 rounded-xl">
                      <div className="h-2 w-2/3 bg-white/30 rounded-full"></div>
                      <div className="h-2 w-1/3 bg-white/20 rounded-full mt-2"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-8 left-0 right-0 flex justify-around">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div 
                        key={i}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm"
                        animate={{ y: i === 2 ? [0, -5, 0] : 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Phone reflection */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-rabitbee/20 filter blur-xl"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Download;
